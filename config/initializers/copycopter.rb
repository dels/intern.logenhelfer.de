CopycopterClient.configure do |config|
  config.api_key = '42637b68a6b5f87a9f492bd72c3d8b26'
  config.secure = false
  config.host = 'copycopter.deftwork.com'
#  config.development_environments = %w(staging) # defaults to %w(development staging)
#  config.http_read_timeout = 60
#  config.http_open_timeout = 60
#  config.polling_delay = 10 unless Rails.env.production? # seconds, defaults to 300 seconds or 5 minutes
#  config.middleware = nil
end
