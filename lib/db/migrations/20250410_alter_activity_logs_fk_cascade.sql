ALTER TABLE activity_logs DROP CONSTRAINT activity_logs_user_id_users_id_fk;

ALTER TABLE activity_logs
ADD CONSTRAINT activity_logs_user_id_users_id_fk
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;