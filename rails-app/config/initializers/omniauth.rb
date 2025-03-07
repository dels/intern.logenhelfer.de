OmniAuth.config.logger = Rails.logger
#require 'json'
Rails.application.config.middleware.use OmniAuth::Builder do

  conf = JSON::parse(File.read(Rails.root.join("google_auth.json")))
  
  provider :google_oauth2, conf["web"]["client_id"],
           conf["web"]["client_secret"],
           {
             scope: 'email, profile, contacts',
             prompt: 'select_account',
             "access_type" => "offline",         # offline access
             "include_granted_scopes" => "true",  # incremental auth
             client_options:
              {ssl:
                 {ca_file: Rails.root.join("cacert.pem").to_s}
              }
           }
end
