--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'RECRUITER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: Status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Status" AS ENUM (
    'PENDING',
    'SHORTLISTED',
    'REJECTED',
    'REVIEWED',
    'ACCEPTED'
);


ALTER TYPE public."Status" OWNER TO postgres;

--
-- Name: WorkMode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WorkMode" AS ENUM (
    'OFFICE',
    'HOME',
    'REMOTE',
    'HYBRID'
);


ALTER TYPE public."WorkMode" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Application; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Application" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "jobId" integer NOT NULL,
    "resumeUrl" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."Status" DEFAULT 'PENDING'::public."Status" NOT NULL
);


ALTER TABLE public."Application" OWNER TO postgres;

--
-- Name: ApplicationAudit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ApplicationAudit" (
    id integer NOT NULL,
    "applicationId" integer NOT NULL,
    "previousStatus" public."Status" NOT NULL,
    "newStatus" public."Status" NOT NULL,
    "changedById" integer NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ApplicationAudit" OWNER TO postgres;

--
-- Name: ApplicationAudit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ApplicationAudit_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ApplicationAudit_id_seq" OWNER TO postgres;

--
-- Name: ApplicationAudit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ApplicationAudit_id_seq" OWNED BY public."ApplicationAudit".id;


--
-- Name: Application_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Application_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Application_id_seq" OWNER TO postgres;

--
-- Name: Application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Application_id_seq" OWNED BY public."Application".id;


--
-- Name: Job; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Job" (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    company text NOT NULL,
    location text NOT NULL,
    "postedById" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "salaryMax" integer,
    "salaryMin" integer,
    role text,
    "workMode" public."WorkMode" DEFAULT 'REMOTE'::public."WorkMode" NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    incentive text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "workTime" text
);


ALTER TABLE public."Job" OWNER TO postgres;

--
-- Name: JobView; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."JobView" (
    id integer NOT NULL,
    "jobId" integer NOT NULL,
    "userId" integer,
    ip text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."JobView" OWNER TO postgres;

--
-- Name: JobView_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."JobView_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."JobView_id_seq" OWNER TO postgres;

--
-- Name: JobView_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."JobView_id_seq" OWNED BY public."JobView".id;


--
-- Name: Job_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Job_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Job_id_seq" OWNER TO postgres;

--
-- Name: Job_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Job_id_seq" OWNED BY public."Job".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "loginCount" integer DEFAULT 0 NOT NULL,
    bio text,
    education text,
    experience text,
    location text,
    phone text,
    "profilePic" text,
    "resumeUrl" text,
    skills text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: Application id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application" ALTER COLUMN id SET DEFAULT nextval('public."Application_id_seq"'::regclass);


--
-- Name: ApplicationAudit id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApplicationAudit" ALTER COLUMN id SET DEFAULT nextval('public."ApplicationAudit_id_seq"'::regclass);


--
-- Name: Job id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Job" ALTER COLUMN id SET DEFAULT nextval('public."Job_id_seq"'::regclass);


--
-- Name: JobView id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobView" ALTER COLUMN id SET DEFAULT nextval('public."JobView_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Application; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Application" (id, "userId", "jobId", "resumeUrl", "createdAt", status) FROM stdin;
\.


--
-- Data for Name: ApplicationAudit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ApplicationAudit" (id, "applicationId", "previousStatus", "newStatus", "changedById", note, "createdAt") FROM stdin;
\.


--
-- Data for Name: Job; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Job" (id, title, description, company, location, "postedById", "createdAt", "salaryMax", "salaryMin", role, "workMode", views, incentive, "updatedAt", "workTime") FROM stdin;
\.


--
-- Data for Name: JobView; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."JobView" (id, "jobId", "userId", ip, "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, name, role, "createdAt", "updatedAt", "loginCount", bio, education, experience, location, phone, "profilePic", "resumeUrl", skills) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
60add017-ae57-4f75-ae5b-a9a919f179cd	00118a2ea7ce03df8af861846a57897ebf95c42efaf6d5243459df2e1aee3abc	2025-09-18 11:29:15.136397+05:30	20250806110931_init	\N	\N	2025-09-18 11:29:15.089365+05:30	1
ea5b6317-7448-4011-8bf0-7e036ac5a459	7d5df9836b66dfae9bd3d53140b0c9e53cfa4ea2af5fba4ea378d516ae808511	2025-09-18 11:29:15.142772+05:30	20250808075107_add_status_enum	\N	\N	2025-09-18 11:29:15.137699+05:30	1
f822208e-3639-4443-8124-b149840278ee	6fed6419b93c16449412d7364e1d7c36f77f6570c7aa662a967041304afaee60	2025-09-18 11:29:15.155735+05:30	20250811082149_add_application_audit	\N	\N	2025-09-18 11:29:15.14371+05:30	1
ed354d40-604a-44ec-b63d-457172ac0e92	48e3a8b8491beb13a12f018e99085349db8f2fa79a4bf80fe52c85d744bf4d66	2025-09-18 11:29:15.163949+05:30	20250811093054_add_application_audit	\N	\N	2025-09-18 11:29:15.157318+05:30	1
f35ef804-d7a0-40c7-a8ef-ece7698fd906	39387b7383410885dce2d6dcdb7a2cd0214ea97181f905facf8d1abb00f1c9c4	2025-09-18 11:29:15.168894+05:30	20250811102730_add_salary_range_to_job	\N	\N	2025-09-18 11:29:15.16492+05:30	1
64c3c6ef-d65b-4152-870e-fd74455e6ceb	93dfd78ef7cef472e41d50248995ee996f1d53fdb9174b291b4605f930fcc6f5	2025-09-18 11:29:15.17526+05:30	20250813064049_add_workmode_and_role_to_job	\N	\N	2025-09-18 11:29:15.17013+05:30	1
5897ece7-79ce-4a49-8288-6b61f5293d14	4e1cac488f510dcc4c7df68e9e8ffc5806232bbee77bbc22be26eaa6dd4ce0ed	2025-09-18 11:29:15.189037+05:30	20250819120828_add_jobview_and_logincount	\N	\N	2025-09-18 11:29:15.176198+05:30	1
7b8f0521-aed4-4e0b-9f53-255845c8f8cf	68e931cd965bfd2a79491f2f2d9f1bf3b4678a2e53510eb6809a33c9e352a5dc	2025-09-18 11:29:15.195872+05:30	20250825060742_add_user_profile_fields	\N	\N	2025-09-18 11:29:15.191195+05:30	1
0f28a8ad-0d06-4467-9d33-5658e017d0ed	4ab533192cdbe4cce86a04577c586225c1751f530c962575d0a45a14dff50591	2025-09-18 11:34:26.526508+05:30	20250918060426_add_incentive_worktime	\N	\N	2025-09-18 11:34:26.520482+05:30	1
\.


--
-- Name: ApplicationAudit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ApplicationAudit_id_seq"', 1, false);


--
-- Name: Application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Application_id_seq"', 1, false);


--
-- Name: JobView_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."JobView_id_seq"', 1, false);


--
-- Name: Job_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Job_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 1, false);


--
-- Name: ApplicationAudit ApplicationAudit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApplicationAudit"
    ADD CONSTRAINT "ApplicationAudit_pkey" PRIMARY KEY (id);


--
-- Name: Application Application_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_pkey" PRIMARY KEY (id);


--
-- Name: JobView JobView_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobView"
    ADD CONSTRAINT "JobView_pkey" PRIMARY KEY (id);


--
-- Name: Job Job_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Job"
    ADD CONSTRAINT "Job_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ApplicationAudit_applicationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApplicationAudit_applicationId_idx" ON public."ApplicationAudit" USING btree ("applicationId");


--
-- Name: ApplicationAudit_changedById_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApplicationAudit_changedById_idx" ON public."ApplicationAudit" USING btree ("changedById");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: ApplicationAudit ApplicationAudit_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApplicationAudit"
    ADD CONSTRAINT "ApplicationAudit_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ApplicationAudit ApplicationAudit_changedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApplicationAudit"
    ADD CONSTRAINT "ApplicationAudit_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Application Application_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."Job"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Application Application_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JobView JobView_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobView"
    ADD CONSTRAINT "JobView_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."Job"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobView JobView_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobView"
    ADD CONSTRAINT "JobView_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Job Job_postedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Job"
    ADD CONSTRAINT "Job_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

