class UserMailer < ActionMailer::Base
  default from: AppConfig[:default_from_email]


  def change_notification(changed_user, deleted_addresses, changing_user)
    @user = changed_user
    @secretary  = UserRole.where(role_id: Role.where(name: 'Secretary').first).first
    return unless @secretary

    @changing_user_info = changing_user.fullname
    roles = changing_user.roles.where(name: %w[Admin Secretary])
    if roles.count > 0
      @changing_user_info << " (#{roles.map(&:display_name).to_sentence})"
    end

    @secretary    = @secretary.user
    @user_changes = @user.previous_changes
    @user_changes.delete("updated_at")
    @user_changes.delete("created_at")

    @new_addresses      = []
    @deleted_addresses  = deleted_addresses
    @address_changes    = @user.addresses.map do |a|
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
    end.compact

    mail to: AppConfig[:user_change_notification_email], subject: I18n.t('user_mailer.change_notification.subject')
  end
end
