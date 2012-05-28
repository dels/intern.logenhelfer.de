class EventsController < AuthorizedController
  def index
  end

  def show
  end

  def date
    @day   = params[:day]   || Date.today.day
    @month = params[:month] || Date.today.month
    @year  = params[:year]  || Date.today.year
    @ctx   = view_context

    return day    if params[:day]
    return month  if params[:month]
    year
  end

  def upcoming
    @date = if params[:week].present?
      last_view = upcoming_calendar_path(week: params[:week])
      Date.parse(params[:week]).beginning_of_week
    else
      last_view = upcoming_calendar_path
      Date.today.beginning_of_week
    end
    events = Event.where('events.date >= ? AND events.date <= ?', @date, @date.end_of_week)

    @events = Hash.new {|h,k| h[k] = [] }
    events.where('events.whole_day = ?', false).each do |event|
      @events[event.date.days_to_week_start] << event
    end

    @whole_day_events = Hash.new {|h,k| h[k] = [] }
    events.where('events.whole_day = ?', true).each do |event|
      @whole_day_events[event.date.days_to_week_start] << event
    end
  end

  def new
    @event.date = Date.parse(params[:date]) if params[:date].present?
    @event.time = Time.parse(params[:time]) if params[:time].present?
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

  def day
    @date             = Date.parse("#{@year}/#{@month}/#{@day}")
    last_view         = calendar_path(year: @date.year, month: @date.month, day: @date.day)
    @partial          = :day
    @events           = Event.where('events.date >= ? AND events.date <= ?', @date.beginning_of_day, @date.end_of_day)
    @whole_day_events = @events.where(whole_day: true)
    @events           = @events.where(whole_day: false)
  end

  def month
    @date             = Date.parse("#{@year}/#{@month}/1")
    last_view         = calendar_path(year: @date.year, month: @date.month)
    @partial          = :month
    calendar_options  = {
      first_day_of_week: 1, # monday
      yield_surrounding_days: true,
      calendar_class: 'calendar month',
      current_month:  lambda {|d| I18n.l d, :format => '%B %Y' },
      previous_month: lambda {|d| @ctx.link_to("&laquo; #{I18n.l d, format: '%B'}".html_safe, @ctx.calendar_path(year: d.year, month: d.month)) },
      next_month:     lambda {|d| @ctx.link_to("#{I18n.l d, format: '%B'} &raquo;".html_safe, @ctx.calendar_path(year: d.year, month: d.month)) }
    }

    events = Event.where('events.date >= ? AND events.date <= ?', @date - 7.days, @date + 35.days)

    @events_by_date = Hash.new {|h,k| h[k] = Hash.new {|l,m| l[m] = [] } }
    events.each do |event|
      @events_by_date[event.date.month][event.date.day] << event
    end

    @calendar = LaterDude::Calendar.new(@date.year, @date.month, calendar_options) do |date|
      @ctx.render 'month_day', date: date, events: @events_by_date
    end
  end

  def year
    @date         = Date.parse("#{@year}/1/1")
    last_view     = calendar_path(year: @date.year)
    @partial      = :year
    @events       = Event.where('events.date >= ? AND events.date <= ?', @date.beginning_of_year, @date.end_of_year)
  end

  def last_view=(where)
    session[:calendar_last_view] = where
  end

end
