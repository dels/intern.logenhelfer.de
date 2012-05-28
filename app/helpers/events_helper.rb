module EventsHelper

  def calendar_context_menu(date, hour, offset)
    date    += offset.days
    datetime = date + hour.hours
    {
      context_menu: [
        {
          name: I18n.l(datetime, format: '%d.%m.%Y - %H:%M'),
          disabled: true
        },{
          name: 'Details',
          icon: 'show',
          path: calendar_path(year: date.year, month: date.month, day: date.day)
        },{
          name: 'Neuer Termin...',
          icon: 'add',
          path: new_event_path(date: date, time: "#{hour}:00")
        }
      ]
    }
  end

end
