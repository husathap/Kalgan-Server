# db.rb

# Preparing the database for the server.

require 'data_mapper'
require 'dm-serializer'

DataMapper::setup(:default, "sqlite3://#{Dir.pwd}/data.db")

class User
  include DataMapper::Resource
  property :id, Serial
  property :email, String
  property :token, String
  property :interviewTime, DateTime
end

class Log
  include DataMapper::Resource
  property :id, Serial
  property :userId, String
  property :navAgent, Text
  property :videoId, String
  property :time, DateTime
  property :type, String
  property :data, Text
  property :vidTime, String
end

DataMapper.finalize

User.auto_upgrade!
Log.auto_upgrade!
