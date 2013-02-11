# -*- coding: utf-8 -*-


namespace :import do 
  desc 'import existing data'
  task :memberlist  => :environment do
    puts "reading #{Rails.root}/memberlist.csv"
    apprentice_role = Role.where(:name => 'EnteredApprentice').first
    line_num = 0
    File.open("#{Rails.root}/memberlist.csv", "r").each_line do |line|
      cur = line.split(';')
      num = 0
      cur.each do |elem|
        puts "#{num}: #{elem}"
        num += 1
      end
      u = User.new
      pa = Address.new
      ga = Address.new
      ur = UserRole.new
      ur.role = apprentice_role
      u.user_roles << ur
      date_of_intake = cur[10].gsub(/Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember/, "Januar" => "01", "Februar" => "02", "März" => "03", "April" => "04", "Mai" => "05", "Juni" => "06", "Juli" => "07", "August" => "08", "September" => "09", "Oktober" => "10", "November" => "11", "Dezember" => "12").gsub(/\./, "" => "")
      begin
        ur.role_added_at = Date.strptime(date_of_intake, '%d %m %Y')
      rescue
        puts "unaccepted intake date: #{date_of_intake}"
        break
      end
      ga.type_of_address = 1
      pa.purpose = "privat"
      pa.type_of_address = 0
      pa.zip = cur[15]
      pa.city = cur[16]
      pa.street1 = cur[17]
      pa.phone = cur[19]
      ga.phone = cur[21]
      pa.mobile = cur[22]
      ga.mobile = cur[23]
      pa.fax = cur[24]
      ga.fax = cur[25]
      u.password = "changem3s00n#{cur[9]}"
      unless cur[26].empty?
        pa.email = cur[26]
        u.email = cur[26]
      else
        pa.email = "#{cur[3]}.#{cur[4]}@fwze.de"
        u.email = "#{cur[3]}.#{cur[4]}@fwze.de"
      end
      u.firstname = cur[3]
      u.lastname = cur[4]
      u.matriculation_number = cur[9]
      u.date_of_birth = Date.strptime("#{cur[37]}/#{cur[36]}/#{cur[38]}", '%m/%d/%Y')    
      u.job_title = cur[7]
      begin
        u.date_of_birth = Date.strptime("#{cur[37]}/#{cur[36]}/#{cur[38]}", '%m/%d/%Y')
      rescue 
        puts "unacceptedbirth date: #{date_of_acceptance}"
        break
      end
      unless cur[13].empty?
        date_of_acceptance = cur[13].gsub(/Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember/, "Januar" => "01", "Februar" => "02", "März" => "03", "April" => "04", "Mai" => "05", "Juni" => "06", "Juli" => "07", "August" => "08", "September" => "09", "Oktober" => "10", "November" => "11", "Dezember" => "12").gsub(/\./, "" => "")
      
        begin
          u.accepted_at = Date.strptime(date_of_acceptance, '%d %m %Y')
        rescue
          puts "unaccepted acceptance date: #{date_of_acceptance}"
          break
        end
      end
      puts "unable to save business address" unless ga.save!
      puts "unable to save private address" unless pa.save!
      u.addresses << pa
      u.addresses << ga
      unless u.save!
        puts "unable to save #{u.firstname} #{u.lastname}"
      else
        puts "saved #{u.firstname} #{u.lastname}"
      end
    end
  end
end




desc 'Create YAML test fixtures from data in an existing database.  
Defaults to development database.  Set RAILS_ENV to override.'

task :extract_fixtures => :environment do
  sql  = "SELECT * FROM %s"
  skip_tables = ["schema_info"]
  ActiveRecord::Base.establish_connection
  (ActiveRecord::Base.connection.tables - skip_tables).each do |table_name|
    i = "000"
    File.open("#{Rails.root}/test/fixtures/#{table_name}.yml", 'w') do |file|
      data = ActiveRecord::Base.connection.select_all(sql % table_name)
      file.write data.inject({}) { |hash, record|
        hash["#{table_name}_#{i.succ!}"] = record
        hash
      }.to_yaml
    end
  end
end