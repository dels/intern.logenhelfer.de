class CreateAcademicTitles < ActiveRecord::Migration
  def change
    create_table :academic_titles do |t|
      t.string :title
      t.string :short
      t.boolean :deleted, default: false

      t.timestamps
    end
    add_index :academic_titles, :short, unique: true
    add_index :academic_titles, :title, unique: true
    add_column :users, :academic_title_id, :integer
  end
end
