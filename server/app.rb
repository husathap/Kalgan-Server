# app.rb

require 'sinatra'
require 'json'
require 'date'
require 'ezcrypto'
require 'csv'
require_relative 'db'
require_relative 'azure'

# Settings #####################################################################

#enable :sessions
#set :session_secret, "i don't know, i don't care, don't ask me why@#"

use Rack::Session::Cookie, :key => 'rack.session',
                           :path => '/',
                           :secret => "OMITTED"

username = "admin"
password = "m4r1o,LUIGI"

key = EzCrypto::Key.with_password "OMITTED", "OMITTED"

# Do not cache public asset!
set :static_cache_control, [:public, :max_age => 0]

# Helper functions #############################################################

def authenticated?(key)
  if session["email"] and session["token"]
    return User.count(:email => session["email"], :token => key.encrypt(session["token"])) == 1
  end

  return false
end

def getUserId(key)
  user = User.first(:email => session["email"], :token => key.encrypt(session["token"]))
  return user.id.to_s
end

# Homepage #####################################################################
get '/' do
  # If a valid ID is found in session, redirect to /main with proper session.
  # If a valid ID is not found, ask for one or ask to sign up.
  if authenticated? key
    redirect to('/main')
  else
    erb :'index'
  end
end

#### ADMIN PAGES ###############################################################

# Admin page
get '/admin_user' do
  # Show the admin page. It's incomplete until a post is sent to /admin_login.
  erb :'admin_user'
end

# Admin verify
post '/admin_login' do

  params = JSON.parse(request.env["rack.input"].read)

  if params['username'] == username and params['password'] == password then # Pathetic Super User code for now.

    if params['task'] == "users"  # Get the users
      content_type :json

      puts "Requested for user data"
      _user = []

      User.all.each do |u|
        _user.push({ :id => u.id, :email => u.email, :token => key.decrypt(u.token), :interviewTime => u.interviewTime })
      end

      { :request => "admin_login", :status => "authorized", :users => _user, :logs => Log.all }.to_json
    elsif params['task'] == "log" # Get the logs
      puts "Requested for log"

      # Make a single-use key.
      session["admin_dump_data_secret"] = key.encrypt(username + "!!" + password + "##datadump&&")
      { :request => "admin_login", :status => "authorized", :task => "log" }.to_json
    end
  else
    { :request => "admin_login", :status => "unauthorized" }.to_json
  end
end

get '/dump_data' do

  # Ask for the single-use key. If fails, then show that data access is not authorized.
  if session["admin_dump_data_secret"] == key.encrypt(username + "!!" + password + "##datadump&&")
    content_type 'application/octet-stream'
    attachment "log.csv"

    puts session["admin_dump_data_secret"]

    puts "SUCCESS!"
    session.clear

    return Log.all.to_csv
  else
    "Unauthorized or link expired."
  end
end

################################################################################

# Log in
post '/login' do
  content_type :json
  # Verify that the token exists.

  if User.count(:email => params["email"], :token => key.encrypt(params["token"])) > 0
    session[:email] = params["email"]
    session[:token] = params["token"]
    redirect to("/main")
  else
    redirect back
  end
end

# Log out
get '/logout' do
  session.clear
  redirect to('/')
end

# Sign up
get '/signup' do
  # Show the consent form, ask to sign.
  # Then deal with the consenting process.

  erb :signup
end

# Consenting
post '/consent' do
  # Ask for a consent signature.
  # Check against the database if the request is valid.
  # If not, reject and inform.
  # If yes, update the database and email the token.
  # Then redirect to the main page.
  content_type :json

  params = JSON.parse(request.env["rack.input"].read)

  begin
    if User.count(:interviewTime => DateTime.parse(params["time"])) > 0
      puts "Same time booking"
      {:request => "consent", :result => "failed", :message => "Someone has booked at the same time! Please select a different time."}.to_json
    elsif User.count(:email => params["email"]) > 0
      puts "Same email"
      {:request => "consent", :result => "failed", :message => "Someone has already booked using this email address! Please use a different one."}.to_json
    else
      rdn = Random.new(Time.now.to_i)
      token = (rdn.rand * 100000).round.to_s
      eToken = key.encrypt(token)

      User.create(:email => params["email"], :token => eToken, :interviewTime => params["time"])

      # Log in the user for the good of mankind! Still, it's erb who must do the redirect!
      session[:email] = params["email"]
      session[:token] = token

      {:request => "consent", :result => "success", :token => token}.to_json
    end
  rescue => error

    puts error
    {:request => "consent", :result => "failed", :message => error.to_s}.to_json
  end
end

# Main #########################################################################
get '/main' do
  # This is the main page.
  # If the session token is not found, redirect to /.
  # If the session token is found, then display the page.

  #cache_control :no_cache, :no_store

  if authenticated? key
    record = User.first(:email => session["email"], :token => key.encrypt(session["token"]))
    @interviewTime = record.interviewTime

    # Check if trained or not.
    erb :main
  end
end

# Player #######################################################################
get '/player' do
  # The video player itself.

  #cache_control :no_cache, :no_store

  if authenticated? key
    erb :player
  else
    redirect back
  end
end

# Help #########################################################################
get '/help' do
  # The help page.

  #cache_control :no_cache, :no_store

  if authenticated? key
    erb :help
  else
    redirect back
  end
end

# Tracking #####################################################################

# Logging the data coming from the user #
post '/track' do
  if authenticated? key
    params = JSON.parse(request.env["rack.input"].read)
    Log.create(:id => nil,
      :userId => getUserId(key),
      :time => params["time"],
      :type => params["type"],
      :data => params["data"],
      :videoId => params["videoId"],
      :navAgent => params["navAgent"],
	  :vidTime => params["vidTime"]
    )

    puts({:userId => getUserId(key), :time => params["time"], :type => params["type"], :data => params["data"], :videoId => params["videoId"], :navAgent => params["navAgent"], :vidTime => params["vidTime"]})
  end
end

# Dump log #
get '/admin_dump' do
  erb :admin_dump
end

# Vocab ########################################################################

get '/vocab' do
  content_type :json

  if authenticated? key
    ret = getVocab(@@azure_key, params["from"], params["to"], params["text"])
    ret = ret.force_encoding('UTF-8')
    {:request => "vocab", :status => "success", :result => ret}.to_json
  else
    {:request => "vocab", :status => "fail"}.to_json
  end

end
