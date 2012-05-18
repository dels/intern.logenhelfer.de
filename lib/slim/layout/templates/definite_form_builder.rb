class DefiniteFormBuilder < ActionView::Helpers::FormBuilder
  delegate :content_tag, :tag, to: :@template

  %w[text_field text_area password_field collection_select email_field number_field file_field].each do |method_name|
    alias_method "plain_#{method_name}".to_sym, method_name.to_sym

    define_method(method_name) do |name, *args|
      content_tag :dt, field_label(name, *args) +
      content_tag(:dd, super(name, *jqueryfy(args)))
    end
  end

  def date_select(name, *args)
    options = {
      class: 'datepicker'
    }.merge(args.extract_options!)
    if (value = object.try(name)).present?
      options[:value] = I18n.l(value)
    end
    args << options
    text_field name, *jqueryfy(args)
  end

  def submit(value=nil, *args)
    content_tag(:dt, "&nbsp;".html_safe) + content_tag(:dd, super)
  end

  def error_messages
    if object.errors.full_messages.any?
      content_tag(:div, class: "error_messages") do
        content_tag(:h2, I18n.t('activerecord.errors.header', default: "Invalid Fields")) +
        content_tag(:p, I18n.t('activerecord.errors.template.body', default: "Correct the following errors and try again.")) +
        content_tag(:ul) do
          object.errors.full_messages.map do |msg|
            content_tag(:li, msg)
          end.join.html_safe
        end
      end
    end
  end

private

  def jqueryfy(args)
    options = { jui: :normal }.merge(args.extract_options!)
    size = options.delete(:jui)
    options[:class] = Array.wrap(options[:class]) + jqueryui_classes[size]
    args << options
  end

  def field_label(name, *args)
    options = args.extract_options!
    required = object.class.validators_on(name).any? { |v| v.kind_of? ActiveModel::Validations::PresenceValidator } rescue false
    label(name, options[:label], class: ("required" if required))
  end

  def objectify_options(options)
    super.except(:label)
  end

  def jqueryui_classes
    base = ['ui-widget', 'ui-widget-content', 'ui-widget-container', 'ui-corner-all']
    {
      tiny: ['very-small'] + base,
      small: ['small'] + base,
      medium: ['medium-small'] + base,
      normal: base,
      large: ['large'] + base
    }
  end

end
