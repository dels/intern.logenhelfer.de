class FileMailer < ActionMailer::Base
  ActionMailer::Base.default from: AppConfig[:default_from_email]

  def file_upload_success_mail(user, success_link, filename)
    @success_link = success_link
    @user = user
    @filename = filename
    mail(to: user.email, bcc: User.admin.email, subject: "#{I18n.t('file_mailer.file_uploaded')} #{success_link}", user: user.firstname)
  end

end
