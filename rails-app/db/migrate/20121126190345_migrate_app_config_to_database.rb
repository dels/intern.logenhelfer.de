class MigrateAppConfigToDatabase < ActiveRecord::Migration
  def up
    say_with_time "inserting configuration from app_config.yml for #{Rails.env} environment to database" do
      AppConfig.load_from_config_file
    end
    say "You may now delete the `#{Rails.env}' section from app_config.yml."
    say 'Some additional tasks have been defined, which may help the migration:'
    say '    rake config:sync:up RAILS_ENV=...                -- sync DB with app_config.yml', true
    say '    rake config:sync:down RAILS_ENV=...              -- sync app_config.yml with DB', true
  end

  def down
  end
end
