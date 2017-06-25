# coding: utf-8
class GoogleContactManager

  def self.all_contacts(auth_token)
    begin
      xml_resp = RestClient.get("https://www.google.com/m8/feeds/contacts/default/full",
                                {params:
                                   {
                                     'max-results': 1000000,
                                    'GData-Version': '3.0',
                                    'Content-Type': 'application/atom+xml',
                                    'access_token': auth_token
                                   }
                                })
    rescue Exception => e
      Rails.logger.fatal("exception while requesting contacts feed: #{e.inspect}")
      return nil
    end
    debug_resp(xml_resp)
    xml_resp
  end
  
  def self.create(auth_token, google_contact)
    RestClient.log = 'stdout' if Rails.env.development?
    system_group_contacts = GoogleGroupManager.contacts_group_id(auth_token)
    raise ("could not find system group 'Contacts'") unless system_group_contacts
    lodge_group = GoogleGroupManager.lodge_group_id(auth_token)
    raise ("could not create or find group #{AppConfig[:lodge_short]}") unless lodge_group

    unless google_contact.groups.find_index(lodge_group)
      google_contact.groups << lodge_group
    end
    unless google_contact.groups.find_index(system_group_contacts)
      google_contact.system_groups << system_group_contacts
    end

    atom = google_contact.to_atom
    url = "https://www.google.com/m8/feeds/contacts/default/full"
    puts "posting to #{url} \n#{atom}" if Rails.env.development?
    
    RestClient.post(url, atom,
                    params: {
                      #'Authorization': "Bearer #{auth_token}"
                      'access_token': auth_token,
                    },
                    'GData-Version': '3.0',
                    'Content-Type': 'application/atom+xml'
                   ) {|response, request, result|
      case response.code
      when 201
        Rails.logger.debug("resp body: \n#{response.body}")
        return true
      when 400
        Rails.logger.fatal("received 400 while creating google contact #{google_contact.name}")
        return false
      else
        Rails.logger.fatal("response code was #{response.code}")
        return false
      end
    }
    debug_resp(response)
  end

  def self.contact(auth_token, self_url)
    xml_resp = RestClient.get(self_url,
                              {params:
                                 {                                  
                                   'access_token': auth_token
                                 },
                               'GData-Version': '3.0',
                               #'v': '3',
                               'Content-Type': 'application/atom+xml'
                              })
    xml = Nokogiri::XML(xml_resp)
    debug_resp(xml_resp)
    GoogleContact::parse_xml(xml)
  end
  
  
  def self.merge(auth_token, url, usr_obj)
    change_msgs = []
    gc_res = contact(auth_token, url)
    gc_usr = GoogleContact::parse_user(usr_obj)
    # check phone numbers
    unless gc_res.work_phone.eql?(gc_usr.work_phone)
      change_msgs << "Work Tel. Nr aktualisiert. #{change_message(gc_res.work_phone.join(','), gc_usr.work_phone.join(','))}"
      gc_res.work_phone = gc_usr.work_phone
    end
    unless gc_res.home_phone.eql?(gc_usr.home_phone)
      change_msgs << "Home Tel. Nr. aktualisiert. #{change_message(gc_res.home_phone.join(','), gc_usr.home_phone.join(','))}"
      gc_res.home_phone = gc_usr.home_phone
    end
    unless gc_res.mobile_phone.eql?(gc_usr.mobile_phone)
      change_msgs << "Mobil Nr. aktualisiert. #{change_message(gc_res.mobile_phone.join(','), gc_usr.mobile_phone.join(','))}"
      gc_res.mobile_phone = gc_usr.mobile_phone
    end
    # check emails
    unless gc_res.home_email.eql?(gc_usr.home_email)
      change_msgs << "Home E-Mail aktualisiert. #{change_message(gc_res.home_email.join(','), gc_usr.home_email.join(','))}"
      gc_res.home_email = gc_usr.home_email
    end
    unless gc_res.work_email.eql?(gc_usr.work_email)
      change_msgs << "Work E-Mail aktualisiert. #{change_message(gc_res.work_email.join(','), gc_usr.work_email.join(','))}"
      gc_res.work_email = gc_usr.work_email
    end
    # check birthdate
    unless gc_res.date_of_birth.to_s.eql?(gc_usr.date_of_birth.to_s)
      change_msgs << "Geburtsdatum aktualisiert. #{change_message(gc_res.date_of_birth, gc_usr.date_of_birth)}"
      gc_res.date_of_birth = gc_usr.date_of_birth
    end
    # FIXME just adding the addresses without comparison
    unless gc_res.home_address[:street].eql?(gc_usr.home_address[:street])
      gc_res.home_address[:street] = gc_usr.home_address[:street]
    end
    unless gc_res.home_address[:postcode].eql?(gc_usr.home_address[:postcode])
      gc_res.home_address[:postcode] = gc_usr.home_address[:postcode]
    end
    unless gc_res.home_address[:city].eql?(gc_usr.home_address[:city])
      gc_res.home_address[:city] = gc_usr.home_address[:city]
    end
    unless gc_res.work_address[:street].eql?(gc_usr.work_address[:street])
      gc_res.work_address[:street] = gc_usr.work_address[:street]
    end
    unless gc_res.work_address[:postcode].eql?(gc_usr.work_address[:postcode])
      gc_res.work_address[:postcode] = gc_usr.work_address[:postcode]
    end
    unless gc_res.work_address[:city].eql?(gc_usr.work_address[:city])
      gc_res.work_address[:city] = gc_usr.work_address[:city]
    end
    
    gc_usr.other_address.each do |addr|
      gc_res.other_address << addr
    end
    
    return nil unless update(auth_token, url, gc_res)
    change_msgs
  end

  def self.change_message(prev, succ)
    return "war: #{prev}. neu: #{succ}"# if prev.is_a?(String) && succ .is_a?(String)
    # TODO deal with email arrays
  end
    
  def self.update(auth_token, self_url, contact)
    #RestClient.log = 'stdout'
    unless contact.system_groups.index(GoogleGroupManager::contacts_group_id(auth_token))
      contact.system_groups << GoogleGroupManager::contacts_group_id(auth_token)
    end
    unless contact.groups.index(GoogleGroupManager::lodge_group_id(auth_token))
      contact.groups << GoogleGroupManager::lodge_group_id(auth_token)
    end
    if Rails.env.development?
      puts "-"*60
      puts "putting:"
      puts contact.to_atom
    end
    begin
      xml_resp = RestClient.put(self_url, contact.to_atom,
                                params: {
                                  'access_token': auth_token
                                },
                                'GData-Version': '3.0',
                                'If-Match': '*',
                                'Content-Type': "application/atom+xml"
                               )
    rescue Exception => e
      Rails.logger.fatal("could not update #{contact.name}: #{e.inspect}")
      return nil
    ensure 
      debug_resp(xml_resp)
    end
    xml_resp
  end


  private

  def self.debug_resp(resp)
    return unless  Rails.env.development?
    puts "-"*60
    puts "received header:\n#{resp.headers}\n" if resp
    puts "received body:\n#{resp.body}\n" if resp
  end
  
end
