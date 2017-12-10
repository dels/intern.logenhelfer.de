class EventMailer < ActionMailer::Base
  default from: AppConfig[:default_from_email]

  def new_event_subscription_notification(event, user)
    @secretary  = User.secretary
    return unless @secretary
    @user = user
    @event = event
    mail to: @secretary.email, cc: user.email, subject: I18n.t('event_mailer.new_subscription_notification.subject', user: user.firstname)
  end

  def new_external_event_subscription_notification(event, user)
    @secretary  = User.secretary
    return unless @secretary
    @user = user
    @external_event = event
    mail to: @secretary.email, cc: user.email, subject: I18n.t('event_mailer.new_subscription_notification.subject', user: user.firstname)
  end

  def new_external_event_desubscription_notification(event, user)
    @secretary  = User.secretary
    return unless @secretary
    @user = user
    @external_event = event
    mail to: @secretary.email, cc: user.email, subject: I18n.t('event_mailer.new_desubscription_notification.subject', user: user.firstname)
  end

  def event_subscription_confirmed_notification(event, user)
    @secretary  = User.secretary
    return unless @secretary
    @user = user
    @event = event
    mail to: user.email, cc: @secretary.email, subject: I18n.t('event_mailer.subscription_confirmed_notification.subject', user: @secretary.firstname)
  end
  
  def external_event_subscription_confirmed_notification(event, user)
    @secretary  = User.secretary
    return unless @secretary
    @user = user
    @external_event = event
    mail to: user.email, cc: @secretary.email, subject: I18n.t('event_mailer.subscription_confirmed_notification.subject', user: @secretary.firstname)
  end

  def subscribed_to_event_by_secretary(event, user)
    @secretary  = User.secretary
    return unless @secretary
    @user = user
    @event = event
    mail to: user.email, cc: @secretary.email, subject: I18n.t('event_mailer.subscribed_to_event_by_secretary.subject', user: @secretary.firstname)
  end

  def subscribed_to_external_event_by_secretary(event, user)
    @secretary  = User.secretary
    return unless @secretary
    @user = user
    @external_event = event
    mail to: user.email, cc: @secretary.email, subject: I18n.t('event_mailer.subscribed_to_external_event_by_secretary.subject', user: @secretary.firstname)
  end

  def desubscribed_to_event_by_secretary(event, user)
    @secretary  = User.secretary
    return unless @secretary
    @user = user
    @event = event
    @title = event[:title]
    @date = Date::parse(event[:date])
    @festive_board = event[:title]
    mail to: user.email, cc: @secretary.email, subject: I18n.t('event_mailer.desubscribed_to_event_by_secretary.subject', user: @secretary.firstname)
  end
  
  def desubscribed_to_external_event_by_secretary(event, user)
    @secretary  = User.secretary
    return unless @secretary
    @user = user
    @external_event = event
    @title = event[:title]
    @host = event[:host]
    @festive_board = event[:title]
    mail to: user.email, cc: @secretary.email, subject: I18n.t('event_mailer.desubscribed_to_external_event_by_secretary.subject', user: @secretary.firstname)
  end
end
