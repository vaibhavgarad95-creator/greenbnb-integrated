import GuestBookingsLink from "./components/GuestBookingsLink";
import Link from "next/link";
import HomeLogin from "./components/HomeLogin";
const stays = [
  {
    slug: "forest-escape-cabin",
    name: "Forest Escape Cabin",
    location: "Lonavala, Maharashtra",
    price: 3200,
    emoji: "🌲",
    color: "#e5eddf",
    rating: "4.92",
    description:
      "Escape the busy city and enjoy a peaceful cabin surrounded by greenery.",
  },
  {
    slug: "peaceful-hill-retreat",
    name: "Peaceful Hill Retreat",
    location: "Mahabaleshwar, Maharashtra",
    price: 2800,
    emoji: "🏡",
    color: "#f2e5d6",
    rating: "4.88",
    description:
      "Relax in a cozy hill retreat and enjoy a refreshing nature getaway.",
  },
  {
    slug: "eco-friendly-lake-house",
    name: "Eco-Friendly Lake House",
    location: "Mulshi, Maharashtra",
    price: 4500,
    emoji: "🏞️",
    color: "#dcebea",
    rating: "4.96",
    description:
      "Enjoy a relaxing lakeside escape and a memorable break close to nature.",
  },
];

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fff",
        color: "#20352b",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          padding: "22px 7%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e8ece8",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 27,
            fontWeight: 800,
            color: "#238052",
            textDecoration: "none",
          }}
        >
          🌿 GreenBnB
        </Link>

        <nav
          style={{
            display: "flex",
            gap: 22,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="#stays"
            style={{ color: "#20352b", textDecoration: "none" }}
          >
            Explore stays
          </Link>

          <Link
            href="#about"
            style={{ color: "#20352b", textDecoration: "none" }}
          >
            About
          </Link>

          <Link
            href="#stays"
            style={{
              background: "#238052",
              color: "#fff",
              padding: "11px 18px",
              borderRadius: 24,
              textDecoration: "none",
            }}
          >
            Find a stay
            
          </Link>
          <Link href="/explore" style={{ color: "#238052", textDecoration: "none", fontWeight: 700 }}>
            Search all stays
          </Link>
          <Link href="/dashboard" style={{ color: "#238052", textDecoration: "none", fontWeight: 700 }}>
            Dashboard
          </Link>
          <GuestBookingsLink />
          <HomeLogin />
        </nav>
      </header>

      <section
        style={{
          padding: "76px 7% 58px",
          background: "linear-gradient(135deg, #edf6eb, #f8f5e9)",
        }}
      >
        <p
          style={{
            color: "#238052",
            fontWeight: 700,
            letterSpacing: 2,
            fontSize: 12,
          }}
        >
          TRAVEL BETTER. LIVE GREENER.
        </p>

        <h1
          style={{
            fontSize: "clamp(38px, 6vw, 66px)",
            lineHeight: 1.1,
            maxWidth: 720,
            margin: "16px 0",
          }}
        >
          Discover stays that are kinder to our planet.
        </h1>

        <p
          style={{
            fontSize: 17,
            color: "#647469",
            maxWidth: 570,
            lineHeight: 1.8,
          }}
        >
          Find peaceful escapes, nature-inspired homes, and
          memorable stays for your next adventure.
        </p>

        <Link
          href="#stays"
          style={{
            display: "inline-block",
            marginTop: 18,
            background: "#238052",
            color: "white",
            padding: "14px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Explore stays →
        </Link>
      </section>

      <section id="stays" style={{ padding: "52px 7%" }}>
        <p style={{ color: "#238052", fontWeight: 700 }}>
          HANDPICKED GETAWAYS
        </p>

        <h2 style={{ fontSize: 32, marginTop: 8 }}>
          Stay closer to nature
        </h2>

        <p style={{ color: "#647469", lineHeight: 1.7 }}>
          Discover places for your next weekend escape.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
            marginTop: 28,
          }}
        >
          {stays.map((stay) => (
            <article
              key={stay.slug}
              style={{
                border: "1px solid #e6ebe6",
                borderRadius: 16,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div
                style={{
                  background: stay.color,
                  minHeight: 190,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 76,
                  position: "relative",
                }}
              >
                {stay.emoji}

                <span
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    background: "white",
                    padding: "7px 11px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  ECO STAY
                </span>
              </div>

              <div style={{ padding: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 18 }}>
                    {stay.name}
                  </h3>

                  <span>★ {stay.rating}</span>
                </div>

                <p style={{ color: "#647469", fontSize: 14 }}>
                  {stay.location}
                </p>

                <p>{stay.description}</p>

                <p>
                  <strong>
                    ₹{stay.price.toLocaleString("en-IN")}
                  </strong>
                  <span style={{ color: "#647469" }}>
                    {" "} / night
                  </span>
                </p>

                <Link
                  href={`/stays/${stay.slug}`}
                  style={{
                    display: "block",
                    boxSizing: "border-box",
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #238052",
                    background: "#fff",
                    color: "#238052",
                    fontWeight: 700,
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  View stay →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p
          style={{
            color: "#647469",
            fontSize: 13,
            marginTop: 22,
          }}
        >
          Demo listings for design preview. Prices and ratings
          are illustrative.
        </p>
      </section>

      <footer
        id="about"
        style={{
          padding: "28px 7%",
          background: "#20352b",
          color: "#fff",
          lineHeight: 1.8,
        }}
      >
        <strong>🌿 GreenBnB</strong>

        <p style={{ color: "#d1ded4", marginBottom: 0 }}>
          Travel thoughtfully. Discover nature. Leave a lighter footprint.
        </p>

        <p style={{ color: "#d1ded4", fontSize: 13 }}>
          A sustainable-stay booking website demo.
        </p>
      </footer>
    </main>
  );
}
