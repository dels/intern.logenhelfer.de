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
  task obfuscate: :environment do
    desc "reads currents environments' database and obfuscates names and files"
    list_of_firstnames = %w|Aaron Abel Abimelech Abraham Adam Aram Ascher Asur Balthasar Barnabas Baruch Benjamin Boas Dan Daniel David Eleasar Elias Elisa Elkana Ephraim Esau Ezra Gabriel Gad Gideon Henoch Hosea Immanuel Isaak Israel Issachar Jakob Jamin Jeremia Jesaja Joachim Joel Jonas Jonathan Josef Josua Klemens Lazarus Levi Lukas Manasse Markus Matthias Melchior Michael Mose Nahum Nathan Nathanel Noah Obadja Paulus Quartus Quirinius Raphael Ruben Salomon Samuel Samson Saul Saulus Sem Simson Stefan Thomas Timon Timotheus Tobias Uriel Zachäus Zacharias|
    list_of_lastnames = %w|Müller Schmidt Schneider Fischer Weber Meyer Wagner Becker Schulz Hoffmann Schäfer Koch Bauer Richter Klein Wolf Schröder Neumann Schwarz Zimmermann Braun Krüger Hofmann Hartmann Lange Schmitt Werner Schmitz Krause Meier Lehmann Schmid Schulze Maier Köhler Herrmann König Walter Mayer Huber|


    r = Random.new
    User.all.each do |usr|
      next if usr.roles.include? Role.find_by_name("Admin")
      if usr.roles.include? Role.find_by_name("Secretary") 
        usr.firstname = "Korrespondierender"
        usr.lastname = "Schriftführer"
        usr.email = "sekretaer@logenhelfer.de"
        usr.password = "Salomon333"
      elsif usr.roles.include? Role.find_by_name("WorshipfulMaster")
        usr.firstname = "Meister"
        usr.lastname = "vom Stuhl"
        usr.email = "mvst@logenhelfer.de"
        usr.password = "Salomon333"
      else
        begin
          usr.firstname = list_of_firstnames[r.rand(list_of_firstnames.size)]
          usr.lastname = list_of_lastnames[r.rand(list_of_lastnames.size)]
          usr.email = "#{usr.firstname}.#{usr.lastname}@logenhelfer.de"
        end while false == User.where(:firstname => usr.firstname, :lastname => usr.lastname).empty?
      end
      begin
        usr.matriculation_number = r.rand(1000)
      end while false == User.where(:matriculation_number => usr.matriculation_number).empty?
      usr.date_of_birth = (usr.date_of_birth - r.rand(20).years) - r.rand(100).days
      usr.save!
      puts "saved #{usr}"
      usr.addresses.each do |addr|
        if addr.private?
          addr.street1 = 'Muster Str. 1'
          addr.mobile = '+49 (170) 4711 0815'
          addr.phone = '+49 (421) 4711 0815 - 0'
          addr.fax = '+49 (421) 4711 0815 - 99'
          addr.email = "#{usr.firstname}.#{usr.lastname}@gmail.com"
          addr.zip = '0815'
          addr.city = 'Heimatdorf'
          begin
            addr.save!
          rescue Exception => e
            puts e
            puts addr
            puts usr
          end 
        elsif addr.business?
          addr.street1 = 'Postfach 4711'
          addr.street2 = ''
          addr.street3 = "c/o Herr #{usr.lastname}"
          addr.mobile = '+49 (170) 4711 0815'
          addr.phone = '+49 (421) 4711 0815 - 0'
          addr.fax = '+49 (421) 4711 0815 - 99'
          addr.email = "#{usr.firstname}.#{usr.lastname}@deftwork.com"
          addr.zip = '4711'
          addr.city = 'Arbeitsstadt'
          begin
            addr.save!
          rescue Exception => e
            puts e
            puts addr
            puts usr
          end
        else
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
    end
    # obsfuscate attached files
#    ActiveRecord::Base.establish_connection origin_db
#    AttachedFile.all.each do |file|
#      
#    end
    
  end
end
