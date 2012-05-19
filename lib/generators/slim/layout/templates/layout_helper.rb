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

  def show_link_to_all target
    t = 'View all'
    link_to image_tag('all.png', :alt => t), target, :title => t
  end

  def show_link_to target
    t = 'Show'
    link_to image_tag('show.png', :alt => t), target, :title => t
  end

  def edit_link_to target
    t = 'Edit'
    link_to image_tag('edit.png', :alt => t), target, :title => t
  end

  def destroy_link_to target
    t = 'Destroy'
    link_to image_tag('destroy.png', :alt => t), target, :title => t, :confirm => 'Are you sure?', :method => :delete
  end
end
