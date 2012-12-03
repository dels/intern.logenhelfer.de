require File.expand_path('../boot', __FILE__)

require 'rails/all'

if defined?(Bundler)
  # If you precompile assets before deploying to production, use this line
  Bundler.require(*Rails.groups(:assets => %w(development test)))
  # If you want your assets lazily compiled in production, use this line
  # Bundler.require(:default, :assets, Rails.env)
end

module FwzeIntern
  class Application < Rails::Application
    # config.autoload_paths += %W(#{config.root}/extras)
    # config.plugins = [ :exception_notification, :ssl_requirement, :all ]
    # config.active_record.observers = :cacher, :garbage_collector, :forum_observer
    # config.active_record.schema_format = :sql

    config.time_zone = 'Berlin'

    # Bypass Rails bug with I18n. Bug suddenly appeared after migrating acedemic
    # titles from static hash to database.
    # TODO: Needs further investigation.
    config.before_configuration do
      I18n.load_path += Dir[Rails.root.join('config', 'locales', '*.{rb,yml}').to_s]
      I18n.locale = :de
      I18n.default_locale = :de
      config.i18n.load_path += Dir[Rails.root.join('config', 'locales', '*.{rb,yml}').to_s]
      config.i18n.locale = :de
      I18n.reload!
      config.i18n.reload!
    end

    config.i18n.available_locales = [:de]
    config.i18n.default_locale = :de

    config.encoding = "utf-8"
    config.filter_parameters += [:password]

    config.active_record.whitelist_attributes = true
    config.assets.enabled = true
    config.assets.version = '1.0'
  end
end
