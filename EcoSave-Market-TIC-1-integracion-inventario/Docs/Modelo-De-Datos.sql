-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.attachments (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  bucket text NOT NULL,
  path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  entity_type text NOT NULL,
  entity_id integer NOT NULL,
  uploaded_by integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT attachments_pkey PRIMARY KEY (id),
  CONSTRAINT fk_attachments_user FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
CREATE TABLE public.donations (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  product_id integer NOT NULL,
  user_id integer NOT NULL,
  ong_id integer,
  product_name text NOT NULL,
  product_category text NOT NULL,
  quantity integer NOT NULL,
  expiry_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'available'::text CHECK (status = ANY (ARRAY['available'::text, 'requested'::text, 'completed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  requested_at timestamp with time zone,
  completed_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT donations_pkey PRIMARY KEY (id),
  CONSTRAINT donations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT donations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT donations_ong_id_fkey FOREIGN KEY (ong_id) REFERENCES public.users(id)
);
CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  recipient text NOT NULL,
  email_type text NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'sent'::text,
  error_message text,
  CONSTRAINT email_logs_pkey PRIMARY KEY (id),
  CONSTRAINT email_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.locations (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre text NOT NULL,
  tipo text NOT NULL,
  direccion text NOT NULL,
  especialidades jsonb NOT NULL DEFAULT '[]'::jsonb,
  lat double precision,
  lng double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT locations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  urgent boolean NOT NULL DEFAULT false,
  product_id integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  products jsonb NOT NULL,
  total numeric NOT NULL,
  payment_method text NOT NULL,
  shipping_address text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  validation_errors jsonb,
  processing_notes text,
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  nombre text NOT NULL,
  categoria text NOT NULL,
  unidades integer NOT NULL,
  vencimiento timestamp with time zone NOT NULL,
  estado text NOT NULL DEFAULT 'Disponible'::text,
  precio double precision,
  descuento double precision DEFAULT 0,
  imagen text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT fk_products_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.roles (
  id integer NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_profiles (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL UNIQUE,
  name text NOT NULL,
  business text,
  phone text,
  address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  role_id integer DEFAULT 1,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
