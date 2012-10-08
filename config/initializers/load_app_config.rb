raw_config = File.read("#{Rails.root}/config/app_config.yml")
APP_CONFIG = YAML.load(raw_config)[Rails.env].symbolize_keys
APP_CONFIG[:archive] = Rails.env.archive? || Rails.env.archive_dev?
