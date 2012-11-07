class UserMailer < ActionMailer::Base
  default from: "notice@fwze.de"

  # Subject can be set in your I18n file at config/locales/en.yml
  # with the following lookup:
  #
  #   en.user_mailer.change_notification.subject
  #
  def change_notification(changed_user)
    @changed_user = changed_user
    @secretary = UserRole.where(:role_id => Role.where(:name => 'Secretary').first).first.user
    mail to: "korr.schriftfuehrer@fwze.de", subject: I18n.t('user_mailer.change_notification.subject')
  end
end
