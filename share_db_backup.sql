--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: miyagawakiyomi
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Account" OWNER TO miyagawakiyomi;

--
-- Name: CustomLink; Type: TABLE; Schema: public; Owner: miyagawakiyomi
--

CREATE TABLE public."CustomLink" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    "displayOrder" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CustomLink" OWNER TO miyagawakiyomi;

--
-- Name: Profile; Type: TABLE; Schema: public; Owner: miyagawakiyomi
--

CREATE TABLE public."Profile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    slug text NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "lastAccessed" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Profile" OWNER TO miyagawakiyomi;

--
-- Name: SnsLink; Type: TABLE; Schema: public; Owner: miyagawakiyomi
--

CREATE TABLE public."SnsLink" (
    id text NOT NULL,
    "userId" text NOT NULL,
    platform text NOT NULL,
    username text,
    url text NOT NULL,
    "displayOrder" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SnsLink" OWNER TO miyagawakiyomi;

--
-- Name: User; Type: TABLE; Schema: public; Owner: miyagawakiyomi
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    "nameEn" text,
    password text,
    image text,
    bio text,
    "mainColor" text DEFAULT '#3B82F6'::text NOT NULL,
    phone text,
    company text,
    "emailVerified" timestamp(3) without time zone,
    "subscriptionId" text,
    "trialEndsAt" timestamp(3) without time zone,
    "subscriptionStatus" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyLabel" text,
    "companyUrl" text
);


ALTER TABLE public."User" OWNER TO miyagawakiyomi;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: miyagawakiyomi
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


ALTER TABLE public._prisma_migrations OWNER TO miyagawakiyomi;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: miyagawakiyomi
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, "createdAt", "updatedAt") FROM stdin;
cm8b516qn000c8ov63iwf4brb	cm8b516qi000a8ov60z4t42cb	oidc	google	107002299460955652236	\N	ya29.a0AeXRPp4PlOG5mxy6Y2r9OFp9pNVtC3oQB_G3LEqjJz093cAZstNaanHg4PoqbEyB2LD4RTXjZmb6Gc6sPpV-Wa4iN8_Ia52ZggXO42IhF7kiHY191HLlxBlwbo-hRmjo561xOuG5G6yYCC44qKuOZUsBv9P7LliAYyPQwLhbnwaCgYKAZkSARESFQHGX2MieFYSR68QxR1eaS9LzBB09Q0177	1742103048	bearer	https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid	eyJhbGciOiJSUzI1NiIsImtpZCI6IjkxNGZiOWIwODcxODBiYzAzMDMyODQ1MDBjNWY1NDBjNmQ0ZjVlMmYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxNDcwMDQ1ODg1MTMtZHFqY25mdDA0aXByNGU2MTIxaG5pcjlibTZuZW4wNDguYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIxNDcwMDQ1ODg1MTMtZHFqY25mdDA0aXByNGU2MTIxaG5pcjlibTZuZW4wNDguYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDcwMDIyOTk0NjA5NTU2NTIyMzYiLCJlbWFpbCI6ImppbW9lbW9uQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoidkY1TGVGem1reHgxN3N2R2dZclNwUSIsIm5hbWUiOiLlrq7lt53muIXlrp8iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS1VPZ2prMzh4a3I2OEtWUDRrd0ZuRWEzbXRiYnlaZnBfMUNHZnJ4UHVWMkN0eTF2QT1zOTYtYyIsImdpdmVuX25hbWUiOiLmuIXlrp8iLCJmYW1pbHlfbmFtZSI6IuWuruW3nSIsImlhdCI6MTc0MjA5OTQ1MCwiZXhwIjoxNzQyMTAzMDUwfQ.LhUStWZTpeMlEEAqnJNPiwTMYq12ujyFtEL_ThTk_wDpiLDlp2rAxIWMvyqCuOI4DTQE-SI0P02PfF4FxFv3wWmW9RaysaGdZKKQIXHJRiHv4O5gX6MaWYTKU8qjEePaewFpEigm20A47lgoTUXDfecutg_QOy0NaOjkHQttK2jekPCZrgnaS5R8WEoDK2eiklLvivt1grA7YsxE2x2yT7achxb3aZMgGkA_kuzEj1tmS1jimzd9sqM5PKyJ5a1tHAqNVQq0-bx3tnCB5cSsoTM8XcC-YDPesYfXi8dILW3sLVN0B4pg_jJ04515DmPuHQPYsc2cYTwkkB2tRf6RZg	\N	2025-03-16 04:30:50.208	2025-03-16 04:30:50.208
\.


--
-- Data for Name: CustomLink; Type: TABLE DATA; Schema: public; Owner: miyagawakiyomi
--

COPY public."CustomLink" (id, "userId", name, url, "displayOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Profile; Type: TABLE DATA; Schema: public; Owner: miyagawakiyomi
--

COPY public."Profile" (id, "userId", slug, views, "isPublic", "lastAccessed", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SnsLink; Type: TABLE DATA; Schema: public; Owner: miyagawakiyomi
--

COPY public."SnsLink" (id, "userId", platform, username, url, "displayOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: miyagawakiyomi
--

COPY public."User" (id, email, name, "nameEn", password, image, bio, "mainColor", phone, company, "emailVerified", "subscriptionId", "trialEndsAt", "subscriptionStatus", "createdAt", "updatedAt", "companyLabel", "companyUrl") FROM stdin;
cm8b516qi000a8ov60z4t42cb	jimoemon@gmail.com	宮川清実	\N	\N	https://lh3.googleusercontent.com/a/ACg8ocKUOgjk38xkr68KVP4kwFnEa3mtbbyZfp_1CGfrxPuV2Cty1vA=s96-c	\N	#3B82F6	\N	\N	\N	\N	\N	\N	2025-03-16 04:30:50.203	2025-03-16 04:30:50.203	\N	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: miyagawakiyomi
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
de663706-e682-4192-bbba-e15b9a48ae04	97604d700ced6d75e891e2b1f7db9d68da090dddf73d0da11875b201eaa1382e	2025-03-16 13:27:53.837378+09	20250305082024_init	\N	\N	2025-03-16 13:27:53.817845+09	1
91c320e5-2ee4-41bc-a8f2-cd1c4f8c2aed	904e9df6309eecfcde54221acbace04cc90dcae35fcbc7038de6590ea11b8d90	2025-03-16 13:27:54.41561+09	20250316042754_add_company_url_fields	\N	\N	2025-03-16 13:27:54.414655+09	1
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: miyagawakiyomi
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: CustomLink CustomLink_pkey; Type: CONSTRAINT; Schema: public; Owner: miyagawakiyomi
--

ALTER TABLE ONLY public."CustomLink"
    ADD CONSTRAINT "CustomLink_pkey" PRIMARY KEY (id);


--
-- Name: Profile Profile_pkey; Type: CONSTRAINT; Schema: public; Owner: miyagawakiyomi
--

ALTER TABLE ONLY public."Profile"
    ADD CONSTRAINT "Profile_pkey" PRIMARY KEY (id);


--
-- Name: SnsLink SnsLink_pkey; Type: CONSTRAINT; Schema: public; Owner: miyagawakiyomi
--

ALTER TABLE ONLY public."SnsLink"
    ADD CONSTRAINT "SnsLink_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: miyagawakiyomi
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: miyagawakiyomi
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: miyagawakiyomi
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Profile_slug_key; Type: INDEX; Schema: public; Owner: miyagawakiyomi
--

CREATE UNIQUE INDEX "Profile_slug_key" ON public."Profile" USING btree (slug);


--
-- Name: Profile_userId_key; Type: INDEX; Schema: public; Owner: miyagawakiyomi
--

CREATE UNIQUE INDEX "Profile_userId_key" ON public."Profile" USING btree ("userId");


--
-- Name: SnsLink_userId_platform_key; Type: INDEX; Schema: public; Owner: miyagawakiyomi
--

CREATE UNIQUE INDEX "SnsLink_userId_platform_key" ON public."SnsLink" USING btree ("userId", platform);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: miyagawakiyomi
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: miyagawakiyomi
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomLink CustomLink_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: miyagawakiyomi
--

ALTER TABLE ONLY public."CustomLink"
    ADD CONSTRAINT "CustomLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Profile Profile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: miyagawakiyomi
--

ALTER TABLE ONLY public."Profile"
    ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SnsLink SnsLink_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: miyagawakiyomi
--

ALTER TABLE ONLY public."SnsLink"
    ADD CONSTRAINT "SnsLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

