# load fallback values, runtime config is actually handled by AppConfig & AppConfig::Adapter

APP_CONFIG_FALLBACK = begin
  raw_config = Rails.root.join('config/app_config.yml').read
  YAML.load(raw_config)[Rails.env].symbolize_keys
rescue
  # file not found, env section undefined or malformatted YAML
  {}
end