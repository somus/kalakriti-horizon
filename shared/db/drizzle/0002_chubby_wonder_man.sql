CREATE TABLE "class_coordinators" (
	"user_id" varchar NOT NULL,
	"class_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "class_coordinators_user_id_class_id_pk" PRIMARY KEY("user_id","class_id")
);
--> statement-breakpoint
ALTER TABLE "classes" DROP CONSTRAINT "classes_coordinator_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "class_coordinators" ADD CONSTRAINT "class_coordinators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_coordinators" ADD CONSTRAINT "class_coordinators_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "coordinator_id";