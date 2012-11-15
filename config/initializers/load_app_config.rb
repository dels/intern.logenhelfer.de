raw_config = File.read("#{Rails.root}/config/app_config.yml")
APP_CONFIG = YAML.load(raw_config)[Rails.env].symbolize_keys

APP_CONFIG[:archive] = Rails.env.archive? || Rails.env.archive_dev?

# allowed values for default_workingplan_timespan:
# - int     == days   (ex: 4)
# - int+"d" == days   (ex: 4d)
# - int+"w" == weeks  (ex: 2w)
# - int+"m" == months (ex: 1m)
APP_CONFIG[:default_workingplan_timespan] = case APP_CONFIG[:default_workingplan_timespan].to_s
  when /(\d+)m$/
    $1.to_i * 30
  when /(\d+)w$/
    $1.to_i * 7
  when /(\d+)d?$/
    $1.to_i
  else
    4 * 30
end