const HANDLE = "kyakyaponohakoniwa.bsky.social";
const rail = document.querySelector(".rail");
const counter = document.querySelector(".counter");
const walker = document.querySelector(".walker img");
let workCount = 0;

const pad = (value) => String(value).padStart(2, "0");

function updatePosition() {
  walker.src = `./walker/walk-${(Math.floor(rail.scrollLeft / 64) % 5) + 1}.png`;
  if (!workCount) return;
  const index = Math.min(
    workCount - 1,
    Math.round(rail.scrollLeft / (rail.scrollWidth / workCount)),
  );
  counter.textContent = `${pad(index + 1)} / ${pad(workCount)}`;
}

function move(direction) {
  rail.scrollBy({ left: direction * window.innerWidth * 0.72, behavior: "smooth" });
}

rail.addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    event.preventDefault();
    rail.scrollBy({ left: event.deltaY, behavior: "smooth" });
  }
}, { passive: false });
rail.addEventListener("scroll", updatePosition);
document.querySelector(".previous").addEventListener("click", () => move(-1));
document.querySelector(".next").addEventListener("click", () => move(1));
document.querySelector("main").addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") move(-1);
  if (event.key === "ArrowRight") move(1);
});

async function loadWorks() {
  const params = new URLSearchParams({ actor: HANDLE, filter: "posts_with_media", limit: "100" });
  try {
    const response = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?${params}`);
    if (!response.ok) throw new Error("Feed unavailable");
    const data = await response.json();
    const works = (data.feed || []).flatMap(({ post }) => {
      const images = post.embed?.images || post.embed?.media?.images || [];
      const postId = post.uri.split("/").pop();
      const href = `https://bsky.app/profile/${post.author.handle}/post/${postId}`;
      return images.map((image, imageIndex) => ({
        id: `${post.uri}-${imageIndex}`,
        title: image.alt || post.record.text || "Untitled",
        src: image.fullsize,
        href,
      }));
    });

    rail.replaceChildren();
    if (!works.length) {
      rail.innerHTML = '<p class="message">NO IMAGE POSTS YET</p>';
      return;
    }

    workCount = works.length;
    works.forEach((work, index) => {
      const figure = document.createElement("figure");
      const link = document.createElement("a");
      link.href = work.href;
      link.target = "_blank";
      link.rel = "noreferrer";
      const image = document.createElement("img");
      image.src = work.src;
      image.alt = work.title || `Work ${index + 1}`;
      image.loading = index > 1 ? "lazy" : "eager";
      link.append(image);
      const caption = document.createElement("figcaption");
      const number = document.createElement("span");
      number.textContent = pad(index + 1);
      caption.append(number, document.createTextNode(work.title));
      figure.append(link, caption);
      rail.append(figure);
    });
    updatePosition();
  } catch {
    rail.innerHTML = '<p class="message">POSTS COULD NOT BE LOADED</p>';
  }
}

loadWorks();
