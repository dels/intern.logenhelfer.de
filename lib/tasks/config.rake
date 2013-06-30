# -*- coding: utf-8 -*-
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

namespace :generate do
  def obfuscate_private_addr usr
    unless (addr = usr.private_address)
      addr = Address.new
      addr.type_of_address = 0
    end
    addr.street1 = 'Muster Str. 1'
    addr.mobile = '+49 (170) 4711 0815'
    addr.phone = '+49 (421) 4711 0815 - 0'
    addr.fax = '+49 (421) 4711 0815 - 99'
    addr.email = "#{usr.firstname}.#{usr.lastname}@logenhelfer.de"
    addr.zip = '0815'
    addr.city = 'Heimatdorf'
    addr.save!
    unless usr.private_address
      usr.addresses << addr
    end
  end

  def obfuscate_business_addr usr
    unless (addr = usr.private_address)
      addr = Address.new
      addr.type_of_address = 1
    end
    addr.street1 = 'Postfach 4711'
    addr.street2 = ''
    addr.street3 = "c/o Herr #{usr.lastname}"
    addr.mobile = '+49 (170) 4711 0815'
    addr.phone = '+49 (421) 4711 0815 - 0'
    addr.fax = '+49 (421) 4711 0815 - 99'
    addr.email = "#{usr.firstname}.#{usr.lastname}@logenhelfer.de"
    addr.zip = '4711'
    addr.city = 'Arbeitsstadt'
    addr.save!
    unless usr.private_address
      usr.addresses << addr
    end
  end
  
  task obfuscate: :environment do
    desc "reads currents environments' database and obfuscates names and files"
    list_of_firstnames = %w|Aaron Abel Abimelech Abraham Adam Aram Ascher Asur Balthasar Barnabas Baruch Benjamin Boas Dan Daniel David Eleasar Elias Elisa Elkana Ephraim Esau Ezra Gabriel Gad Gideon Henoch Hosea Immanuel Isaak Israel Issachar Jakob Jamin Jeremia Jesaja Joachim Joel Jonas Jonathan Josef Josua Klemens Lazarus Levi Lukas Manasse Markus Matthias Melchior Michael Mose Nahum Nathan Nathanel Noah Obadja Paulus Quartus Quirinius Raphael Ruben Salomon Samuel Samson Saul Saulus Sem Simson Stefan Thomas Timon Timotheus Tobias Uriel Zachäus Zacharias|
    list_of_lastnames = %w|Müller Schmidt Schneider Fischer Weber Meyer Wagner Becker Schulz Hoffmann Schäfer Koch Bauer Richter Klein Wolf Schröder Neumann Schwarz Zimmermann Braun Krüger Hofmann Hartmann Lange Schmitt Werner Schmitz Krause Meier Lehmann Schmid Schulze Maier Köhler Herrmann König Walter Mayer Huber|

    r = Random.new
    # adding an entered apprentice, a fellowcraft, and a master masons
    print "adding entered apprentice "
    usr = User.where(:email => 'lehrling@logenhelfer.de').first
    usr = User.new unless usr
    begin
      usr.matriculation_number = r.rand(1000)
    end while false == User.where(:matriculation_number => usr.matriculation_number).empty?
    usr.date_of_birth = Date.today - (r.rand(50)) if usr.date_of_birth.blank?
    usr.entered_apprentice_since = Date.today - (r.rand(50)).years
    usr.firstname = "entered"
    usr.lastname = "apprentice"
    usr.email = "lehrling@logenhelfer.de"
    usr.password = "Salomon3"
    obfuscate_business_addr usr
    obfuscate_private_addr usr
    usr.save!
    puts " ... added entered apprentice"

    print "adding fellow craft "
    usr = User.where(:email => 'geselle@logenhelfer.de').first
    usr = User.new unless usr
    begin
      usr.matriculation_number = r.rand(1000)
    end while false == User.where(:matriculation_number => usr.matriculation_number).empty?
    usr.date_of_birth = Date.today - (r.rand(50)) if usr.date_of_birth.blank?
    usr.entered_apprentice_since = Date.today - (r.rand(50)).years
    usr.fellow_craft_since = usr.entered_apprentice_since + 1.years
    usr.firstname = "fellow"
    usr.lastname = "craft"
    usr.email = "geselle@logenhelfer.de"
    usr.password = "Salomon33"
    obfuscate_business_addr usr
    obfuscate_private_addr usr
    usr.save!
    puts "... added fellow craft"

    print "adding master mason "
    usr = User.where(:email => 'meister@logenhelfer.de').first
    usr = User.new unless usr
    begin
      usr.matriculation_number = r.rand(1000)
    end while false == User.where(:matriculation_number => usr.matriculation_number).empty?
    usr.date_of_birth = Date.today - (r.rand(50)) if usr.date_of_birth.blank?
    usr.entered_apprentice_since = Date.today - (r.rand(50)).years
    usr.fellow_craft_since = usr.entered_apprentice_since + 1.years
    usr.master_mason_since = usr.fellow_craft_since + 1.years
    usr.firstname = "master"
    usr.lastname = "mason"
    usr.email = "meister@logenhelfer.de"
    usr.password = "Salomon333"
    obfuscate_business_addr usr
    obfuscate_private_addr usr
    usr.save!
    puts " ... added master mason"

    User.all.each do |usr|
      print "obfuscating #{usr.firstname} #{usr.lastname} "
      usr.date_of_birth = Date.today - (r.rand(50)) if usr.date_of_birth.blank?
      unless usr.accepted_at.blank?
        usr.mother_lodge = 'Mutter Loge zur Erleuchtung'
      end
      usr.entered_apprentice_since = Date.today - (r.rand(50)).years
      usr.fellow_craft_since = usr.entered_apprentice_since + 1.years
      usr.master_mason_since = usr.fellow_craft_since + 1.years

      if usr.roles.include? Role.find_by_name("Secretary") 
        usr.firstname = "Korrespondierender"
        usr.lastname = "Schriftführer"
        usr.email = "sekretaer@logenhelfer.de"
        usr.password = "Salomon333"
        usr.roles << Role.find_by_name("WorkingPlanAdmin")
        usr.roles << Role.find_by_name("UserAdmin")
        usr.roles << Role.find_by_name("FileAdmin")
        print "(Secretary)"
      elsif usr.roles.include? Role.find_by_name("WorshipfulMaster")
        usr.firstname = "Meister"
        usr.lastname = "vom Stuhl"
        usr.email = "mvst@logenhelfer.de"
        usr.password = "Salomon333"
        usr.roles << Role.find_by_name("FileAdmin")
        print "(WorshipfulMaster)"
      elsif usr.roles.include? Role.find_by_name("NetDelegate")
        usr.firstname = "Internet"
        usr.lastname = "Beauftragter"
        usr.email = "web@logenhelfer.de"
        usr.password = "Salomon333"
        usr.roles << Role.find_by_name("WorkingPlanAdmin")
        usr.roles << Role.find_by_name("UserAdmin")
        usr.roles << Role.find_by_name("FileAdmin")
        usr.roles << Role.find_by_name("ApplicationAdmin")
        print "(NetDeleate)"
      elsif usr.roles.include? Role.find_by_name("Admin")
        usr.firstname = "Application"
        usr.lastname = "Admin"
        usr.email = "admin@logenhelfer.de"
        usr.password = "Salomon333"
        usr.roles << Role.find_by_name("Admin")
        print " (Admin)"
      else
        begin
          usr.firstname = list_of_firstnames[r.rand(list_of_firstnames.size)]
          usr.lastname = list_of_lastnames[r.rand(list_of_lastnames.size)]
          usr.email = "#{usr.firstname}.#{usr.lastname}@logenhelfer.de".gsub(/[äüöß]/, 'ä' => 'ae', "ü" => 'ue', 'ö' => 'oe', 'ß' => 'ss')
        end while false == User.where(:firstname => usr.firstname, :lastname => usr.lastname).empty?
      end
      begin
        usr.matriculation_number = r.rand(1000)
      end while false == User.where(:matriculation_number => usr.matriculation_number).empty?
      usr.user_roles.uniq!
      usr.save!
      puts "... to #{usr}"
      obfuscate_business_addr usr
      obfuscate_private_addr usr

      usr.addresses.each do |addr|
        next if addr.private?
        next if addr.business?
        addr.purpose = 'Wochenendhaus'
        addr.street1 = ''
        addr.street2 = ''
        addr.street3 = ''
        addr.zip = '33399'
        addr.city = 'Schlaraffenstadt'
        addr.phone = '+49 (40) 0815 4711'
        addr.fax = nil
        addr.mobile = nil
        begin 
          addr.save!
        rescue Exception => e
          puts e
          puts addr
          puts usr
        end
      end
    end
    # obsfuscate attached files
#    ActiveRecord::Base.establish_connection origin_db
#    AttachedFile.all.each do |file|
#      
#    end
    
  end
end
