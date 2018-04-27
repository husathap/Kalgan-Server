require 'uri'
require 'net/http'
require 'net/https'

require 'openssl'
#OpenSSL::SSL::VERIFY_PEER = OpenSSL::SSL::VERIFY_NONE

# A function to get a new key.
def getAzureKey()
  uri = URI.parse('https://api.cognitive.microsoft.com/sts/v1.0/issueToken')
  https = Net::HTTP.new uri.host, uri.port
  https.use_ssl = true
  https.verify_mode = OpenSSL::SSL::VERIFY_NONE

  req = Net::HTTP::Post.new uri.path, initheader = {'Content-Type' => 'application/json'}
  req['Ocp-Apim-Subscription-Key'] = 'OMITTED'

  res = https.request(req)

  res.body
end

@@azure_key = getAzureKey

# Renew key every 8 minutes.
Thread.new do
  loop do
    @@azure_key = getAzureKey
    puts "Azure key renewed"
    sleep 480
  end
end

# Call Azure to get a meaning of a word.
def getVocab(azure_key, from, to, text)
  appidArg = "?appid=Bearer " + azure_key
  fromArg = "&from=" + from[0..1]
  toArg = "&to=" + to[0..1]
  textArg = "&text=" + text

  escaped = URI.escape('https://api.microsofttranslator.com/v2/http.svc/Translate' + appidArg + textArg + fromArg + toArg)
  uri = URI.parse(escaped)

  https = Net::HTTP.new uri.host, uri.port
  https.use_ssl = true
  https.verify_mode = OpenSSL::SSL::VERIFY_NONE

  req = Net::HTTP::Get.new uri

  res = https.request(req)

  ret = res.body.split(/>|</)[2]
  puts res.code
  puts ret

  ret
end
