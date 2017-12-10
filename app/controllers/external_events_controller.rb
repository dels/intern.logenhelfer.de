# -*- coding: utf-8 -*-
class ExternalEventsController < AuthorizedController
  load_and_authorize_resource :find_by => :uuid
  
  def index
    @external_events = ExternalEvent.where('date >= ?', Date.today - 1.day).order('date ASC, time ASC')
  end

  def show
    if params[:search].present?
      @users = User.search(params[:search]) - @external_event.participants
      @searched = true
    end
  end

  def add_me
    if params[:search].present?
      @users = User.search(params[:search]) - @external_event.participants
      @searched = true
    end
    cur_event = ExternalEvent.find_by_uuid(params[:external_event_id])
    cur_user = User.find_by_uuid(params[:user])
    cur_user ||= current_user
    ExternalEventParticipant.new do |eep|
      eep.user = cur_user
      eep.external_event = cur_event
      eep.subscription_confirmed = false
      eep.festive_board = params[:festive_board]
      eep.save!
    end
    unless User.secretary == current_user
      EventMailer.new_external_event_subscription_notification(cur_event, cur_user).deliver_later
    else
      EventMailer.subscribed_to_external_event_by_secretary(cur_event, cur_user).deliver_later
    end
    redirect_to cur_event, notice: t("activerecord.subscription_successful")
  end

  def remove_me
    if params[:search].present?
      @users = User.search(params[:search]) - @external_event.participants
      @searched = true
    end
    cur_event = ExternalEvent.find_by_uuid(params[:external_event_id])
    cur_user = User.find_by_uuid(params[:user])
    eep = nil
    unless (eep = ExternalEventParticipant.where(:user_id => cur_user.id).where(:external_event_id => cur_event.id)).empty?
      eep = eep.first
      eep_attribs = {
        title: eep.external_event.title,
        host: eep.external_event.host,
        location: eep.external_event.location,
        festive_board: eep.festive_board?.to_s
      }
      eep.destroy
    end
    Rails.logger.debug("attribs from eep: #{eep_attribs.to_s}")
    Rails.logger.fatal("did not find ExternalEventParticipant (already removed?)")
    Rails.logger.debug("--> secretary is #{User.secretary == current_user}")
    if User.secretary == current_user
      EventMailer.desubscribed_to_external_event_by_secretary(eep_attribs, cur_user).deliver_later
    else
      EventMailer.new_external_event_desubscription_notification(cur_event, cur_user).deliver_later
    end
    redirect_to cur_event, notice: t("activerecord.unsubscribing_successful")
  end

  def confirm_subscription
    if params[:search].present?
      @users = User.search(params[:search]) - @external_event.participants
      @searched = true
    end
    
    cur_event = ExternalEvent.find_by_uuid(params[:external_event_id])
    cur_user = User.find_by_uuid(params[:user])
    unless (eep = ExternalEventParticipant.where(:external_event_id => cur_event.id).where(:user_id => cur_user.id)).empty?
      eep = eep.first
      eep.subscription_confirmed = true
      eep.save!
    else
      raise "user/event combination not found"
    end
    EventMailer.external_event_subscription_confirmed_notification(cur_event, cur_user).deliver_later# unless User.secretary == current_user
    redirect_to cur_event, notice: t("activerecord.subscription_successful")
  end

  def new
  end

  def create
    @external_event.created_by_id = current_user.id
    if @external_event.save
      redirect_to @external_event, notice: t("activerecord.create_success", model: t("activerecord.models.external_event"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    @external_event.assign_attributes(params[:external_event])
    @external_event.updated_by_id = current_user.id
    if @external_event.save
      redirect_to @external_event, notice: t("activerecord.update_success", model: t("activerecord.models.external_event"))
    else
      render :edit
    end
  end

  def destroy
    @external_event.deleted = true
    @external_event.save
    redirect_to external_events_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.external_event"))
  end

  private

  def external_event_params
    params.require(:external_event).permit(:title,
                                           :time,
                                           :date,
                                           :host,
                                           :location,
                                           :description)
  end
  
end
