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

  def my_contacts_group_link
    

  end
  
  def create_contact(google_contact)
    RestClient.log = 'stdout' if Rails.env.development?
    if google_contact.groups.empty?
      all_groups
    end
    atom = google_contact.to_atom
    puts "sending \n#{atom}" if Rails.env.development?
    response = RestClient.post("https://www.google.com/m8/feeds/contacts/default/full", atom,
                               {
                                 'Content-Type': 'application/atom+xml',
                                'v': '3',
                                'Authorization': "Bearer #{current_google_user.oauth_token}"
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
