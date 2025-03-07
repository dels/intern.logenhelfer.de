
require 'resque/pool/tasks'

namespace :resque do
  # this task will get called before resque:pool:setup
  # and preload the rails environment in the pool manager
  desc "preloading work?"
  task "setup" => :environment do
    # generic worker setup, e.g. Hoptoad for failed jobs
  end

  desc "setting up the pool"
  task "pool:setup" do
    # close any sockets or files in pool manager
    ActiveRecord::Base.connection.disconnect!
    # and re-open them in the resque worker parent
    Resque::Pool.after_prefork do |job|
      ActiveRecord::Base.establish_connection
    end
  end


  desc "Starts resque-pool daemon."
  task :start, :environment do
    system("cd #{Rails.root};bundle exec resque-pool -d -e #{:environment} start")
  end

  desc "Sends INT to resque-pool daemon to close master, letting workers finish their jobs."
  task :stop, :environment do
    pid = "#{Rails.root}/tmp/pids/resque-pool.pid"
    system("kill -2 `cat #{pid}`")
  end

  desc "Restart resque workers - actually uses resque.stop and lets God restart in due course."
  task :restart, :environment do
    stop # let God restart.
  end

  desc "List all resque processes."
  task :ps, :environment do
    run 'ps -ef f | grep -E "[r]esque-(pool|[0-9])"'
  end

  desc "List all resque pool processes."
  task :psm, :environment do
    run 'ps -ef f | grep -E "[r]esque-pool"'
  end

end
