class AddSlugToDirectories < ActiveRecord::Migration
  def change
    add_column :directories, :slug, :string
    add_column :categories, :slug, :string

    add_index :directories, :slug
    add_index :categories, :slug

    Directory.find_each do |d|
      d.touch
      d.save
    end
    Category.find_each do |c|
      c.touch
      c.save
    end
  end
end
