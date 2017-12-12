# -*- coding: utf-8 -*-
class EventsController < ApplicationController #AuthorizedController
  if ActiveModel::Type::Boolean.new.cast(AppConfig[:public_wp_available_to_anon_users])
    before_action :authenticate_user!, :except => [:workingplan]
  else
    before_action :authenticate_user!
  end

  load_and_authorize_resource :find_by => :uuid
  
  if AppConfig[:public_wp_available_to_anon_users].eql?("t")
    skip_authorize_resource :only => :workingplan
  end

  def index
    redirect_to upcoming_calendar_path
  end

  def show
    if params[:search].present?
      @users = User.search(params[:search]) - @event.participants
      @searched = true
    end
    respond_to do |format|
      format.html
      format.ics
    end
  end

  def add_me
    if params[:search].present?
      @users = User.search(params[:search]) - @event.participants
      @searched = true
    end
    cur_event = Event.find_by_uuid(params[:event_id])
    cur_user = User.find_by_uuid(params[:user])
    cur_user ||= current_user
    EventParticipant.new do |ep|
      ep.user = cur_user
      ep.event = cur_event
      ep.subscription_confirmed = false
      ep.festive_board = params[:festive_board]
      ep.save!
    end
    unless User.secretary == current_user
      EventMailer.new_event_subscription_notification(cur_event, cur_user).deliver_later
    else
      EventMailer.subscribed_to_event_by_secretary(cur_event, cur_user).deliver_later
    end
    redirect_to cur_event, notice: t("activerecord.subscription_successful")
  end

  
  def remove_me
    if params[:search].present?
      @users = User.search(params[:search]) - @external_event.participants
      @searched = true
    end
    cur_event = Event.find_by_uuid(params[:event_id])
    cur_user = User.find_by_uuid(params[:user])
    ep = nil
    unless (ep = EventParticipant.where(:user_id => cur_user.id).where(:event_id => cur_event.id)).empty?
      ep = ep.first
      ep_attribs = {
        title: ep.event.title,
        date: ep.event.date.to_s,
        festive_board: ep.festive_board?.to_s
      }
      ep.destroy
    end
    if User.secretary == current_user
      EventMailer.desubscribed_to_event_by_secretary(ep_attribs, cur_user).deliver_later
    else
      EventMailer.new_event_desubscription_notification(cur_event, cur_user).deliver_later
    end
    redirect_to cur_event, notice: t("activerecord.unsubscribing_successful")
  end
  
  def confirm_subscription
    if params[:search].present?
      @users = User.search(params[:search]) - @external_event.participants
      @searched = true
    end
    
    cur_event = Event.find_by_uuid(params[:event_id])
    cur_user = User.find_by_uuid(params[:user])
    unless (ep = EventParticipant.where(:event_id => cur_event.id).where(:user_id => cur_user.id)).empty?
      ep = ep.first
      ep.subscription_confirmed = true
      ep.save!
    else
      raise "user/event combination not found"
    end
    EventMailer.event_subscription_confirmed_notification(cur_event, cur_user).deliver_later # unless User.secretary == current_user
    redirect_to cur_event, notice: t("activerecord.subscription_successful")
  end

  def date
    @day   = params[:day]   || Date.today.day
    @month = params[:month] || Date.today.month
    @year  = params[:year]  || Date.today.year
    @ctx   = view_context

    @new_event_path_params = {
      date: "#{@year}-#{@month}-#{@day}"
    }

    return day if params[:day]
    month
  end

  def workingplan
    fd = FileDownload.new
    fd.user = current_user
    fd.attached_file = nil
        fd.filename = "Arbeitsplan (öffentlich)"
    fd.remote_ip = current_user ? current_user.current_sign_in_ip : request.remote_ip

    respond_to do |format|
      format.html do
        @from   = Date.today
        @to     = (Date.today + 2.month)
        @events = @events.where('date >= ? AND date <= ?', @from, @to).order('date ASC, whole_day ASC, time ASC')
        fd.filename = "Arbeitsplan (Abruf per HTML)"
        fd.save!
        render layout: 'simplistic'
      end
      format.ics do
        @from   = Date.today
        @to     = 12.months.from_now
        render layout: false
      end
      format.pdf do
        date_from = Date.today.beginning_of_week
        date_to   = (date_from + default_workingplan_timespan).end_of_week
        fd.filename = "Arbeitsplan (Abruf der öffentlichen PDF)"
        fd.save!
        render_workingplan(false, date_from, date_to)
      end
      format.json do
        render text: "to be implemented"
      end
    end
  end

  def internal_workingplan
    return if request.method == 'POST' && render_workingplan(true)
    @from_date = Date.today.beginning_of_month
    @to_date   = (@from_date + default_workingplan_timespan).end_of_month
  end

  def public_workingplan
    return if request.method == 'POST' && render_workingplan(false)
    @from_date = Date.today.beginning_of_month
    @to_date   = (@from_date + default_workingplan_timespan).end_of_month
  end

  def upcoming
    @date = if params[:week].present?
      last_view(upcoming_calendar_path(week: params[:week]))
      Date.parse(params[:week]).beginning_of_week
    else
      last_view(upcoming_calendar_path)
      Date.today.beginning_of_week
    end

    respond_to do |format|
      format.html do
        events = Event.where('events.date >= ? AND events.date <= ?', @date, @date.end_of_week)

        @events = Hash.new {|h,k| h[k] = [] }
        events.where('events.whole_day = ?', false).each do |event|
          @events[event.date.days_to_week_start] << event
        end

        @whole_day_events = Hash.new {|h,k| h[k] = [] }
        events.where('events.whole_day = ?', true).each do |event|
          @whole_day_events[event.date.days_to_week_start] << event
        end
        User.upcoming_birthday_events(@date, @date.end_of_week).each do |event|
          @whole_day_events[event.date.days_to_week_start] << event
        end
      end

      format.ics do
        @from = @date
        @to   = @date.end_of_week

        render layout: false
      end
      format.json do
        render text: "to be implemented"
      end
    end

  end

  def new
    @event.date = Date.parse(params[:date]) if params[:date].present?
    @event.time = Time.parse(params[:time]) if params[:time].present?
    @event.location = AppConfig[:default_event_location]
  end

  def create
    @event.created_by_id = current_user.id
    if @event.save
      redirect_to @event, notice: t("activerecord.create_success", model: t("activerecord.models.event"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    @event.assign_attributes(params[:event])
    @event.updated_by_id = current_user.id
    if @event.save
      redirect_to @event, notice: t("activerecord.update_success", model: t("activerecord.models.event"))
    else
      render :edit
    end
  end

  def destroy
    @event.deleted = true
    @event.save
    redirect_to events_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.event"))
  end


private

  def default_workingplan_timespan
    return AppConfig[:default_workingplan_timespan].days unless AppConfig[:default_workingplan_timespan].nil? || AppConfig[:default_workingplan_timespan].to_s.empty?
    120.days
  end

  def day
    @date = Date.parse("#{@year}/#{@month}/#{@day}")

    respond_to do |format|
      format.html do
        last_view(calendar_path(year: @date.year, month: @date.month, day: @date.day))
        @partial          = :day
        @events           = Event.where('events.date >= ? AND events.date <= ?', @date.beginning_of_day, @date.end_of_day)

        @whole_day_events = @events.where(whole_day: true).to_a + User.upcoming_birthday_events(@date.beginning_of_day, @date.end_of_day)
        @events           = @events.where(whole_day: false)
      end

      format.ics do
        @from = @to = @date
        render layout: false
      end
    end
  end

  def month
    @date = Date.parse("#{@year}/#{@month}/1")

    respond_to do |format|
      format.html do
        last_view(calendar_path(year: @date.year, month: @date.month))
        @partial          = :month
        calendar_options  = {
          first_day_of_week: 1, # monday
          yield_surrounding_days: true,
          calendar_class: 'calendar month',
          current_month:  ->(d) { I18n.l d, format: '%B %Y' },
          previous_month: ->(d) { @ctx.link_to("&laquo; #{I18n.l d, format: '%B'}".html_safe, @ctx.calendar_path(year: d.year, month: d.month)) },
          next_month:     ->(d) { @ctx.link_to("#{I18n.l d, format: '%B'} &raquo;".html_safe, @ctx.calendar_path(year: d.year, month: d.month)) }
        }

        events = Event.where('events.date >= ? AND events.date <= ?', @date - 7.days, @date + 35.days).to_a +
            User.upcoming_birthday_events(@date - 7.days, @date + 35.days)

        @events_by_date = Hash.new {|h,k| h[k] = Hash.new {|l,m| l[m] = [] } }
        events.each do |event|
          @events_by_date[event.date.month][event.date.day] << event
        end

        @calendar = LaterDude::Calendar.new(@date.year, @date.month, calendar_options) do |date|
          @ctx.render 'month_day', date: date, events: @events_by_date
        end
      end

      format.ics do
        @from = @date
        @to   = @date.end_of_month
        render layout: false
      end
    end
  end

  def last_view(where)
    session[:calendar_last_view] = where
  end

  def render_workingplan(internal=false, date_from=nil, date_to=nil)
    begin
      from = date_from || Date.parse(params[:date_from])
    rescue
      flash.now[:error] = t('events.event.invalid_from_date')
      return
    end
    begin
      to   = date_to   || Date.parse(params[:date_to])
    rescue
      flash.now[:error] = t('events.event.invalid_to_date')
      return
    end
    fd = FileDownload.new
    fd.user = current_user
    fd.attached_file = nil
    fd.filename = internal ? "Arbeitsplan (intern)" : "Arbeitsplan (öffentlich)"
    fd.remote_ip = current_user ? current_user.current_sign_in_ip : request.remote_ip
    fd.save!

    pdf = create_pdf_with_header
    add_pdf_title("Arbeitsplan vom #{I18n.l from} bis zum #{I18n.l to}", pdf)

    @events.where('date >= ? AND date <= ?', from, to).order('date ASC, time ASC').group_by { |event|
      event.date.month
    }.each do |month_number,events|
      pdf.move_down(20)
      add_pdf_section(I18n.t("date.month_names")[month_number], pdf)
      day_names = I18n.t('date.day_names')

      current_date = nil
      event_list = events.map do |event|
        if current_date == event.date
          date = ''
          wday = ''
        else
          current_date = event.date
          date = I18n.l(current_date)
          wday = day_names[event.date.wday]
        end

        [
          wday,
          date,
          event.whole_day? ? 'ganztags' : I18n.l(event.time, format: :time_only),
          internal ? event.private_description : event.public_description
        ]
      end

      get_pdf_list(%w[Wochentag Datum Uhrzeit Beschreibung], event_list, { width: pdf.bounds.width, column_widths: { 3 => 330 } }, {}, pdf)
    end

    pdf.start_new_page
    add_pdf_html(AppConfig[:workingplan_footer], pdf)
    # could be shorter, but lets keep it readable
    if AppConfig[:lodge_short].nil? || AppConfig[:lodge_short].blank?
      filename = "Arbeitsplan_%s_%s-%s.pdf" % [internal ? 'intern' : 'oeffentlich', I18n.l(from), I18n.l(to)]
    else
      filename = "#{AppConfig[:lodge_short]}_Arbeitsplan_%s_%s-%s.pdf" % [internal ? 'intern' : 'öffentlich', I18n.l(from), I18n.l(to)]
    end
    send_data pdf.render, type: "application/pdf", filename: filename
  end

  private

  def event_params
    return unless can?(:manage, Event)
    params.require(:event).permit(:title,
                                  :date,
                                  :location,
                                  :whole_day,
                                  :time,
                                  :public_description,
                                  :private_description
                                 )
  end
  
end
