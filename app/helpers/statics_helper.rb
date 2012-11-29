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

end
