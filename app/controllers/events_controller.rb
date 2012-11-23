class EventsController < AuthorizedController
  skip_before_filter :authenticate_user!, only: :workingplan

  def index
    redirect_to upcoming_calendar_path
  end

  def show
  end

  def date
    @day   = params[:day]   || Date.today.day
    @month = params[:month] || Date.today.month
    @year  = params[:year]  || Date.today.year
    @ctx   = view_context

    @new_event_path_params = {
      date: "#{@year}-#{@month}-#{@day}"
    }

    return day    if params[:day]
#    return month  if params[:month]
    month
  end

  def workingplan
    respond_to do |format|
      format.html do
        @from   = Date.today.beginning_of_month
        @to     = Date.today.end_of_month
        @events = @events.where('date >= ? AND date <= ?', @from, @to)
                    .order('date ASC, whole_day ASC, time ASC')

        render layout: 'simplistic'
      end
      format.ics do
        @from   = Date.today
        @to     = 3.months.from_now

        render layout: false
      end
    end
  end

  def internal_workingplan
    return if request.method == 'POST' && export_workingplan(params, true)
    @from_date = Date.today.beginning_of_week
    @to_date   = (@from_date + APP_CONFIG[:default_workingplan_timespan].days).end_of_week
  end

  def public_workingplan
    return if request.method == 'POST' && export_workingplan(params, false)
    @from_date = Date.today.beginning_of_week
    @to_date   = (@from_date + APP_CONFIG[:default_workingplan_timespan].days).end_of_week
  end

  def upcoming
    @date = if params[:week].present?
      last_view(upcoming_calendar_path(week: params[:week]))
      Date.parse(params[:week]).beginning_of_week
    else
      last_view(upcoming_calendar_path)
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
    User.upcoming_birthday_events(@date, @date.end_of_week).each do |event|
      @whole_day_events[event.date.days_to_week_start] << event
    end
  end

  def new
    @event.date = Date.parse(params[:date]) if params[:date].present?
    @event.time = Time.parse(params[:time]) if params[:time].present?
    @event.location = APP_CONFIG[:default_event_location]
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
    last_view(calendar_path(year: @date.year, month: @date.month, day: @date.day))
    @partial          = :day
    @events           = Event.where('events.date >= ? AND events.date <= ?', @date.beginning_of_day, @date.end_of_day)

    @whole_day_events = @events.where(whole_day: true).to_a + User.upcoming_birthday_events(@date.beginning_of_day, @date.end_of_day)
    @events           = @events.where(whole_day: false)
  end

  def month
    @date             = Date.parse("#{@year}/#{@month}/1")
    last_view(calendar_path(year: @date.year, month: @date.month))
    @partial          = :month
    calendar_options  = {
      first_day_of_week: 1, # monday
      yield_surrounding_days: true,
      calendar_class: 'calendar month',
      current_month:  lambda {|d| I18n.l d, format: '%B %Y' },
      previous_month: lambda {|d| @ctx.link_to("&laquo; #{I18n.l d, format: '%B'}".html_safe, @ctx.calendar_path(year: d.year, month: d.month)) },
      next_month:     lambda {|d| @ctx.link_to("#{I18n.l d, format: '%B'} &raquo;".html_safe, @ctx.calendar_path(year: d.year, month: d.month)) }
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

  def last_view(where)
    session[:calendar_last_view] = where
  end

  def export_workingplan(params, internal=false)
    from = Date.parse(params[:date_from])
    to = Date.parse(params[:date_to])

    pdf = create_pdf_with_header
    add_pdf_title("Arbeitsplan vom #{I18n.l from} bis zum #{I18n.l to}", pdf)

    events_by_month = @events.where('date >= ? AND date <= ?', from, to)
        .order('date ASC, time ASC')
        .group_by { |event| event.date.month }
    events_by_month.each_key do |month_number|
      add_pdf_section(I18n.t("date.month_names")[month_number], pdf)

      event_list = events_by_month[month_number].map do |event|
        [
          I18n.t("date.day_names")[event.date.wday],
          I18n.l(event.date),
          event.whole_day? ? 'ganztags' : I18n.l(event.time, format: :time),
          internal ? event.private_description : event.public_description
        ]
      end

      get_pdf_list(%w[Wochentag Datum Uhrzeit Beschreibung], event_list, { width: pdf.bounds.width, column_widths: { 3 => 370 } }, {}, pdf)
    end

    pdf.start_new_page
    add_pdf_html(I18n.t("helpers.pdf.workingplan.bottom_message"), pdf)
    filename = "Arbeitsplan_%s_%s-%s.pdf" % [internal ? 'intern' : 'oeffentlich', I18n.l(from), I18n.l(to)]
    send_data pdf.render, type: "application/pdf", filename: filename
  end

end
