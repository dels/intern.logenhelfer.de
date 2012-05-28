module LayoutHelper

  def title(page_title, show_title = true)
    content_for(:title) { h(page_title.to_s) }
    @show_title = show_title
  end

  def show_title?
    @show_title
  end

  def stylesheet(*args)
    content_for(:head) { stylesheet_link_tag(*args) }
  end

  def javascript(*args)
    content_for(:head) { javascript_include_tag(*args) }
  end

  def image_link_tag_helper image, target, opts={}
    link_to image_tag("#{image}.png", :alt => opts[:title]), target, opts
  end

  def polymorphic_path_helper *args
    options = args.extract_options!
    target = args.first
    if target.is_a?(Array)
      all_ar = true
      target.each do |elem|
        next if(elem.is_a? ActiveRecord::Base)
        all_ar = false
        break
      end
      if all_ar
        target = polymorphic_path(target, options)
      end
    end
    if target.is_a?(ActiveRecord::Base)
      target = polymorphic_path(target, options)
    end
    target
  rescue
    root_url
  end

  def show_link_to_all target
    target = polymorphic_path_helper(target)
    image_link_tag_helper 'all', target, :title => I18n.t('helpers.link.view_all')
  end

  def show_link_to target
    target = polymorphic_path_helper(target)
    image_link_tag_helper 'show', target, :title => I18n.t('helpers.link.show'), :class => 'show'
  end

  def edit_link_to target
    target = polymorphic_path_helper(target, :action => :edit)
    image_link_tag_helper 'edit', target, :title => I18n.t('helpers.link.edit')
  end

  def destroy_link_to(target, opts={})
    target = polymorphic_path_helper(target)
    opts = {
      :title => I18n.t('helpers.link.destroy'),
      :confirm =>  I18n.t('helpers.link.destroy_confirmation'),
      :method => :delete
    }.merge(opts)
    image_link_tag_helper 'destroy', target, opts
  end

  # Rails has an `ActionView::Helpers::UrlHelper#current_page?` method. Some parts were borrowed from there :-)
  def authorized_menu_item(model, target, options={}, &block)
    return unless can?(:index, model)
    li_opts      = options[:li]      || {}
    link_to_opts = options[:link_to] || {}
    ul_opts      = options[:ul]      || {}
    target       = Array.wrap(target)

    active = false

    target.each do |elem|
      if elem =~ /#{controller.controller_name}/x &&
          elem.eql?(elem[0..(elem.index(controller.controller_name) + controller.controller_name.length-1)])
        active = true
        break
      end
    end

    if cls = li_opts[:class]
      li_opts[:class] = [cls, 'active'] if active
    else
      li_opts[:class] = 'active' if active
    end

    content_tag :li, li_opts do
      content = link_to(t("activerecord.models.#{model.name.pluralize.underscore}"), target[0], link_to_opts)
      content << content_tag(:ul, capture(&block), ul_opts) if block_given?
      content
    end
  end

  def jqueryui_input_classes
    "ui-widget ui-widget-content ui-widget-container ui-corner-all"
  end

  def jqueryui_medium_small_input_classes
    "medium-small ui-widget ui-widget-content ui-widget-container ui-corner-all"
  end

  def jqueryui_small_input_classes
    "small #{jqueryui_input_classes}"
  end

  def jqueryui_very_small_input_classes
    "very-small #{jqueryui_input_classes}"
  end

  def dash(obj=nil)
    return obj if obj.present?
    '&mdash;'.html_safe
  end

  def datepicker_field f, field
    obj = f.object.try(field)
    if obj.present?
      f.plain_text_field field, :value => l(obj), :class => jqueryui_input_classes + " datepicker"
    else
      f.plain_text_field field, :class => jqueryui_input_classes + " datepicker"
    end
  end

  def array_to_js_list(array)
    # FIXME (dmke): uhm... what about array.to_json or array.map(&:to_s).to_json?
    str = nil
    for item in array
      unless str
        str = "[#{item.to_s}"
      else
        str << ", #{item.to_s}"
      end
    end
    if str
      str << ']'
    else
      '[]'
    end
  end

  def categories_menu
    res = "".html_safe
    get_authorized(Category.order(:name)).each do |cat| 
      active = request.fullpath =~ /^\/categories\/#{URI.escape(cat.name)}/ 
      res << content_tag(:li, :class => active ? 'active' : nil) do
        blockres = "".html_safe
        blockres << link_to(cat.name, category_path(cat))
        # if current category is in current request and 
        # if any current categories' directory is accessable by the 
        # current user the show the directories as submenue
        # (could be _one_ line but its easies to read like this)
        if active && [] != get_authorized(cat.directories)
          blockres << directories_menu(cat) 
        end
        blockres
      end
    end
    res
  end

  def directories_menu category
    res = "".html_safe
    res << content_tag(:ul, :class => 'space-bottom' ) do
      blockres = "".html_safe
      (get_authorized category.directories.order(:name)).each do |dir|
        active = request.fullpath =~ /^\/categories\/#{category.name}\/directories\/#{URI.escape(dir.name)}/
        blockres << content_tag(:li, :class => active ? 'active' : nil) do 
          link_to(dir.name, category_directory_path(category, dir))
        end
      end
      blockres
    end
    res
  end
end
