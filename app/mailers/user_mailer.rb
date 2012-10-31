class UserMailer < ActionMailer::Base
  default from: "notice@fwze.de"

  # Subject can be set in your I18n file at config/locales/en.yml
  # with the following lookup:
  #
  #   en.user_mailer.change_notification.subject
  #
  def change_notification(changed_user)
    @secretary = User.get_secretary
    unless @secretary
      logger.error "no secretary defined."
      return
    end
    logger.error "sending mail to #{@secretary.email}"
    @changed_user = changed_user
    mail to: @secretary.email, subject: I18n.t('user_mailer.change_notification.subject')
  end
end
