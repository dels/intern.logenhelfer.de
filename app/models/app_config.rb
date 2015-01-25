# Provides a nice interface for raw AppConfig::Adapter class.
#
# Important note: Keys are always treated as symbols. While the values (better:
# their string representation) are stored as strings in the database, the
# getter returns a converted value (see implementation in AppConfig::Adapter).
module AppConfig
  Rails.env.development? ? @@default_refresh_time = 1.seconds : @@default_refresh_time = 5.minutes
  # cached records
  @@records = {}
  @@access_times = Hash.new {|h,k| h[k] = @@default_refresh_time.ago }

  class << self
    # ActiveRecord specific.
    def table_name_prefix
      'app_config_'
    end

    # Getter.
    #
    # To force reload from DB, use
    #
    #     foo = AppConfig[:foo, true]
    def [](key, uncached=false)
      key = key.to_sym
      q = AppConfig::Adapter.where(key: "#{Rails.env}_#{key}")
      if uncached || @@access_times[key] < @@default_refresh_time.ago
        @@records[key] = q.first
        @@access_times[key] = Time.now
      else
        @@records[key] ||= begin
          @@access_times[key] = Time.now
          q.first
        end
      end
      @@records[key].try :value
    end

    # Setter.
    #
    # The string representation of the values are immediately saved to database.
    def []=(key, value)
      key = key.to_sym
      unless @@records[key]
        @@records[key] = AppConfig::Adapter.key(key).first_or_create
      end
      @@records[key].value = value.to_s
      @@records[key].save!
      dirty!(key)
      return if @@records[key].nil?
      @@records[key].value
    end

    # Force reload the next time `key` is accessed.
    def dirty!(key)
      key = key.to_sym
      # really invalidate stuff
      @@access_times[key] = 1000.years.ago
      @@records[key] = nil
    end

    # Get all keys associated with the current environment and eager loads all
    # values into the internal cache.
    def keys
      AppConfig::Adapter.where('key LIKE ?', "#{Rails.env}_%").all.each do |ac|
        @@records[ac.key_without_env] = ac
      end
      @@records.keys
    end

    # Mass-update (usually through controller).
    def update kv_pairs
      AppConfig::Adapter.transaction do
        kv_pairs.each do |k,v|
          self[k] = v
        end
      end
    end

    def load_from_config_file
      # ignore already loaded APP_CONFIG_FALLBACK
      raw_config = File.read("#{Rails.root}/config/app_config.yml")
      update YAML.load(raw_config)[Rails.env].symbolize_keys
    rescue
      # ignore errors
    end

    def dump_to_config_file
      raw_config = Rails.root.join('config/app_config.yml').read
      cfg_all = YAML.load(raw_config)
      cfg_env = {}

      AppConfig.keys.each do |k|
        cfg_env[k.to_s] = AppConfig[k]
      end

      cfg_all[Rails.env] = cfg_env
      Rails.root.join('config/app_config.yml').open('w+') do |f|
        f.write cfg_all.to_yaml
      end
    end
  end
end
