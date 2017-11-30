# -*- coding: utf-8 -*-
class ExternalEventsController < AuthorizedController
  load_and_authorize_resource :find_by => :uuid
  
  def index
    @external_events = ExternalEvent.where('date >= ?', Date.today - 1.day).order('date ASC, time ASC')
  end

  def show
    if params[:search].present?
      @users = User.search(params[:search]) 
      @searched = true
    end
  end

  def add_me
    cur_event = ExternalEvent.find_by_uuid(params[:external_event_id])
    cur_user = User.find_by_uuid(params[:user])
    cur_user ||= current_user
    ExternalEventParticipant.new do |eep|
      eep.user = cur_user
      eep.external_event = cur_event
      eep.festive_board = params[:festive_board]
      eep.save!
    end
    UserMailer.new_subscription_notification(cur_event, cur_user).deliver unless User.secretary == current_user
    redirect_to cur_event, notice: t("activerecord.subscription_successful")
  end

  def remove_me
    cur_event = ExternalEvent.find_by_uuid(params[:external_event_id])
    cur_user = User.find_by_uuid(params[:user])
    unless (eep = ExternalEventParticipant.where(:user_id => cur_user.id).where(:external_event_id => cur_event.id)).empty?
      eep.first.destroy
    end
    redirect_to cur_event, notice: t("activerecord.unsubscribing_successful")
  end

  def confirm_subscription
    cur_event = ExternalEvent.find_by_uuid(params[:external_event_id])
    cur_user = User.find_by_uuid(params[:user])
    unless (eep = ExternalEventParticipant.where(:external_event_id => cur_event.id).where(:user_id => cur_user.id)).empty?
      eep = eep.first
      eep.subscription_sent = true
      eep.save!
    else
      raise "user/event combination not found"
    end
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

end
