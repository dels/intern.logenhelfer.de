class GoogleContactManager

  def initialize(current_google_user)
    @current_google_user = current_google_user
  end
  
  def all_contacts
    return nil unless @current_google_user
    begin
      xml_resp = RestClient.get("https://www.google.com/m8/feeds/contacts/default/full",
                                {params:
                                   {
                                     'max-results': 1000000,
                                    'v': '3',
                                    'Content-Type': 'application/atom+xml',
                                    'access_token': @current_google_user.oauth_token
                                   }
                                })
    rescue Exception => e
      Rails.logger.fatal("exception while requesting contacts feed: #{e.inspect}")
      return nil
    end
    puts "recevied all contacts:" if Rails.env.development?
    puts xml_resp if Rails.env.development?
    xml_resp
  end

  def all_groups
    return nil unless @current_google_user
    begin
      xml_resp = RestClient.get("https://www.google.com/m8/feeds/groups/default/full",
                                {params:
                                   {
                                     'max-results': 1000000,
                                    'Content-Type': 'application/atom+xml',
                                    'v': '3',
                                    'access_token': @current_google_user.oauth_token
                                   }
                                })
    rescue Exception => e
      Rails.logger.fatal("exception while requesting contacts feed: #{e.inspect}")
      return nil
    end
  end

  def my_contacts_group_link()
    xml = Nokogiri::XML(all_groups)
    xml.at("feed").search("entry").each do |entry|
      next unless entry
      next if entry.blank?
      next unless entry.at("id")
      if entry.css("gContact|systemGroup") && entry.css("gContact|systemGroup").first['id'].eql?("Contacts")
        if entry.css("link") && entry.css("link").first['rel'].eql?("self")
          Rails.logger.fatal("system group contacts found at #{entry.css("link").first['href']}")
          return entry.css("link").first['href']
        end
      end
    end
    nil
  end
  
  def create_contact(google_contact)
    RestClient.log = 'stdout' if Rails.env.development?
    system_group_contacts = my_contacts_group_link()
    raise ("could not find system group 'Contacts'") unless system_group_contacts
    unless google_contact.groups.find_index(system_group_contacts)
      google_contact.system_groups << system_group_contacts
    end
    atom = google_contact.to_atom
    url = "https://www.google.com/m8/feeds/contacts/default/full"
    puts "posting to #{url} \n#{atom}" if Rails.env.development?
    response = RestClient.post(url, atom,
                               {
                                 'Content-Type': 'application/atom+xml',
                                'v': '3',
                                'Authorization': "Bearer #{@current_google_user.oauth_token}"
                               })
    if response.code == 201
      res = "Neuen Kontakt erstellt."
      Rails.logger.debug("resp body: \n#{response.body}")
    else
      # FIXME change spaeter to spater with umlaut
      res = "Kontakt konnte nicht erstellt werden. Bitte versuche es spaeter erneut."
      Rails.logger.fatal("response code was #{response.code}")
    end
    res
  end
  
end
