# this is just a dumb key/value store
class AppConfig::Adapter < ActiveRecord::Base
  attr_accessible :key, :value

  # the nil key is actually allowed, but reserved for special cases
  # (which is to be defined)
  validates_uniqueness_of :key

  before_destroy {|rec| AppConfig.dirty!(rec.key_without_env) }

  scope :key, ->(key) { where(key: "#{Rails.env}_#{key}") }

  def key_without_env
    @key_without_env ||= key.gsub(/^#{Rails.env}_/, '').to_sym
  end

  # define some converters
  def getter_bool
    @value == '1'
  end

  alias_method :getter_archive,     :getter_bool
  alias_method :getter_show_admins, :getter_bool

  def getter_default_workingplan_timespan
    case @value.to_s
      when /(\d+)m$/
        $1.to_i * 30
      when /(\d+)w$/
        $1.to_i * 7
      when /(\d+)d?$/
        $1.to_i
      else
        4 * 30
    end
  end

  def setter_bool
    [true, 1, 'true', '1'].any? {|t| t == @value } ? '1' : '0'
  end

  alias_method :setter_archive,     :setter_bool
  alias_method :setter_show_admins, :setter_bool

  # magically convert values
  def value
    @value = super
    converter = "getter_#{key_without_env}"
    @value = self.send converter if respond_to? converter
    @value
  end

  def value=(val)
    @value = val
    converter = "setter_#{key_without_env}"
    @value = self.send converter if respond_to? converter
    super(@value)
  end
end
