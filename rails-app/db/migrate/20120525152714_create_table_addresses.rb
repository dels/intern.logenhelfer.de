# -*- coding: utf-8 -*-
class CreateTableAddresses < ActiveRecord::Migration
  def self.up
    create_table :addresses do |t|
      t.integer :addressable_id
      t.string :addressable_type
      t.string :purpose
      t.string :street1
      t.string :street2
      t.string :street3
      t.string :zip
      t.string :city
      t.string :phone
      t.string :fax
      t.string :email
      t.text :remarks
      t.boolean :deleted, :default => :false
      t.timestamps
    end
  end

  def self.down
    drop_table :addresses
  end

end
