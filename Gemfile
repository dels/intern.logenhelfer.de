source 'https://rubygems.org'

gem 'rails',                    '~>3.2'
gem 'thin'
gem 'pg'
gem 'exception_notification'

gem 'bcrypt-ruby',              require: 'bcrypt'
gem 'devise'
gem 'uuid'

gem 'jquery-rails'
gem 'jquery-ui-rails'
gem 'best_in_place'

gem 'friendly_id',              '~> 4.0.0'
gem 'cancan'#,                   '1.6.7'
gem 'rails-i18n'
gem 'prawn',                    '~> 1.0.0.rc1'
gem 'later_dude',               '>= 0.3.1'
gem 'icalendar',                               '~> 1.5.4'
gem 'kaminari'                  

group :development, :archive_dev do
  gem 'quiet_assets'
  gem 'rails_best_practices',   require: false
  gem 'rails-erd'
  gem 'letter_opener'
  gem 'sextant'
  gem 'brakeman'
  gem 'test-unit'
#  gem 'i18n-debug'
  # disable for now
  # gem 'debugger'
  # gem 'debugger-ruby_core_source'
end

group :assets do
  gem 'sass-rails'#,             '~> 3.2.3'
  gem 'coffee-rails'#,           '~> 3.2.1'
  gem 'libv8' #, '~> 3.11.8'
  gem "therubyracer", '>= 0.11.0beta1', :require => 'v8', platform: :ruby
  gem 'uglifier',               '>= 1.0.3'
  gem 'compass-rails'
end

group :test do
  gem 'turn',                   require: false
  gem 'mocha',                  require: false
  gem "rspec-rails"#,        :git => "git://github.com/rspec/rspec-rails.git"
  gem "rspec"#,              :git => "git://github.com/rspec/rspec.git"
  gem "rspec-core"#,         :git => "git://github.com/rspec/rspec-core.git"
  gem "rspec-expectations"#, :git => "git://github.com/rspec/rspec-expectations.git"
  gem "rspec-mocks"#,        :git => "git://github.com/rspec/rspec-mocks.git"
  gem 'factory_girl_rails'
  gem 'shoulda-matchers'
  gem 'rspec-given'
  gem 'webrat'
end

