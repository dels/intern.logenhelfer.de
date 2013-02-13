# -*- coding: utf-8 -*-
module ControllerMacros
  
  def app_config
    AppConfig[:default_workingplan_timespan]  = 4.weeks
  end

#name: 'InternalSecretary' display_name: 'Protokolliernder Schriftführer')
#name: 'Secretary' display_name: 'Korrespondierender Schriftführer')

#name: 'SeniorWarden'display_name: '1. Aufseher')
#name: 'JuniorWarden'display_name: '2. Aufseher')
#name: 'MemberOfCouncil' display_name: 'Mitglieder des Beamtenrates',group: true)
#name: 'Deakan'display_name: 'Wachhabender')
#name: 'Speaker' display_name: 'Redner')
#name: 'Musician'display_name: 'Musikmeister')
#name: 'MasterOfCeremony'display_name: 'Zeremonienmeister')
#name: 'PreparingBrother'display_name: 'Vorbereitender Bruder')
#name: 'PastMaster'        display_name: 'Altstuhlmeister',              group: true)
#name: 'DedicatedMaster'   display_name: 'zug. Meister',                 group: true)
#name: 'Treasurer'         display_name: 'Schatzmeister')
#name: 'JuniorDeacon'      display_name: '2. Schaffer')
#name: 'SeniorDeacon'      display_name: '1. Schaffer')
#name: 'NetDelegate'         display_name: 'Internet-Beauftragter').first_or_create



  def create_roles
    admin = FactoryGirl.create(:role, :name => 'Admin', :display_name => 'Administrator', :group => true)
    upload = FactoryGirl.create(:role, :name => 'Uploader', :display_name => 'Darf hochladen', :group => true)
    apprentice =  FactoryGirl.create(:role, :name => 'EnteredApprentice', :display_name => 'Lehrling', :group => true)
    fellow_craft =  FactoryGirl.create(:role, :name => 'FellowCraft', :display_name => 'Geselle', :group => true)
    master =  FactoryGirl.create(:role, :name => 'MasterMason', :display_name => 'Meister', :group => true)
    wm = FactoryGirl.create(:role, :name =>  'WorshipfulMaster', :display_name => 'MvSt')
  end



  def login_apprentice
    app_config
    create_roles
    before(:each) do
      @request.env["devise.mapping"] = Devise.mappings[:user]
      user = FactoryGirl.create(:user, :entered_apprentice_since => 5.years.ago)
      sign_in user
    end
  end

  def login_fellow_craft
    app_config
    create_roles
    before(:each) do
      @request.env["devise.mapping"] = Devise.mappings[:user]
      user = FactoryGirl.create(:user, :entered_apprentice_since => 5.years.ago, :fellow_craft_since => 4.years.ago)
      sign_in user
    end
  end

  def login_master_mason
    app_config
    create_roles
    before(:each) do
      @request.env["devise.mapping"] = Devise.mappings[:user]
      user = FactoryGirl.create(:user, :entered_apprentice_since => 5.years.ago, :fellow_craft_since => 4.years.ago, :master_mason_since => 3.years.ago)
      sign_in user
    end
  end


end
