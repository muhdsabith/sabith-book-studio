CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`amazon_url` text NOT NULL,
	`cover_key` text NOT NULL,
	`created_at` integer NOT NULL
);
