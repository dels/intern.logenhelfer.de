namespace :config do
  namespace :sync do
    desc "Read app_config.yml and save config to database (set RAILS_ENV for specific environments)"
    task up: :environment do
      AppConfig.load_from_config_file
    end

    desc "Read config from database and save (as additional section) in config/app_config.yml (set RAILS_ENV for specific environments)"
    task down: :environment do
      AppConfig.dump_to_config_file
    end
  end
end