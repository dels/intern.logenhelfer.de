module StaticsHelper

  def resource_name
    :user
  end

  def resource_class
    User
  end

  def resource
    @resource ||= resource_class.new
  end

  def devise_mapping
    @devise_mapping ||= Devise.mappings[:user]
  end

  def obfuscated_mail_to address
    address = (address || '').gsub(/[@\.]/, '@' => ' [at] ', '.' => ' [punkt] ')
    link_to address, '#', data: { behaviour: 'mailto' }
  end

  def impressum_from_config
    raw_text = AppConfig[:impressum]
    %w[user_change_notification_email default_from_email technical_contact_email mvst_email].each do |mail|
      raw_text = raw_text.gsub(/:(#{mail})/) { obfuscated_mail_to AppConfig[$1.to_sym] }
    end
    raw_text.gsub(/:([\w_]+)/) { AppConfig[$1.to_sym] }.html_safe
  end

  def robots_txt_from_config
    AppConfig[:robots_txt].gsub(/:([\w_]+)/) { AppConfig[$1.to_sym] }.html_safe
  end
end
