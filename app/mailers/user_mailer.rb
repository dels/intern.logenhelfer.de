class UserMailer < ActionMailer::Base
  default from: "notice@fwze.de"


  def change_notification(changed_user)
    @user       = changed_user
    @secretary  = UserRole.where(role_id: Role.where(name: 'Secretary').first).first.user

    # XXX: return if @user.id == @secretary.id

    @user_changes = @user.previous_changes
    @user_changes.delete("updated_at")
    @user_changes.delete("created_at")

    @new_addresses = []

    @address_changes = @user.addresses.map {|a|
      changes = a.previous_changes
      next if changes.empty?
      if changes.key?('id')
        @new_addresses << a
        next
      end

      %w[ updated_at created_at addressable_type addressable_id ].each do |ignore|
        changes.delete ignore
      end

      changes['purpose'] = a.purpose if changes.key?('purpose')
      [a, changes]
    }.compact

    mail to: "korr.schriftfuehrer@fwze.de", subject: I18n.t('user_mailer.change_notification.subject')
  end
end
