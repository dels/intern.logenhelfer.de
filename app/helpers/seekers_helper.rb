module SeekersHelper

  def seekers_contact_data(seeker)
    case seeker.preferred_way_of_contact
    when 10
      return seeker.address.email unless current_user.worshipful_master?
      return mail_to(seeker.address.email, seeker.address.email, subject: I18n.t('mail.seeker.subject'), body: I18n.t('mail.seeker.body', seeker: seeker.lastname, whorshipful_master: User.worshipful_master.fullname)) 
    when 20
      return seeker.address.phone
    when 30
      return seeker.address.fax
    when 40
      return seeker.address.mobile
    when 50
      return seeker.address.to_s
    when 100
      return seeker.address.remarks
    else
      nil
    end
  end
end
