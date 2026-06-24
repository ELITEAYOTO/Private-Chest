use url::Url;

fn host_matches(allowed_host: &str, origin_host: &str) -> bool {
    if origin_host == allowed_host {
        return true;
    }

    origin_host.ends_with(&format!(".{allowed_host}"))
}

pub fn is_origin_allowed(origin: &str) -> bool {
    let Ok(parsed) = Url::parse(origin) else {
        return false;
    };

    parsed.scheme() == "https" && parsed.host_str().is_some()
}

pub fn entry_matches_origin(entry_urls: &[String], origin: &str) -> bool {
    let Ok(origin_url) = Url::parse(origin) else {
        return false;
    };

    if origin_url.scheme() != "https" {
        return false;
    }

    let Some(origin_host) = origin_url.host_str() else {
        return false;
    };

    entry_urls.iter().any(|candidate| {
        let Ok(candidate_url) = Url::parse(candidate) else {
            return false;
        };

        if candidate_url.scheme() != "https" {
            return false;
        }

        let Some(candidate_host) = candidate_url.host_str() else {
            return false;
        };

        host_matches(candidate_host, origin_host)
    })
}

#[cfg(test)]
mod tests {
    use super::{entry_matches_origin, is_origin_allowed};

    #[test]
    fn https_origin_is_required() {
        assert!(is_origin_allowed("https://github.com/login"));
        assert!(!is_origin_allowed("http://github.com/login"));
    }

    #[test]
    fn subdomain_matching_supported() {
        let entry_urls = vec!["https://github.com".to_string()];
        assert!(entry_matches_origin(
            entry_urls.as_slice(),
            "https://gist.github.com"
        ));
        assert!(!entry_matches_origin(
            entry_urls.as_slice(),
            "https://github.com.evil.tld"
        ));
    }

    #[test]
    fn invalid_urls_fail_closed() {
        let entry_urls = vec!["not-a-url".to_string()];
        assert!(!entry_matches_origin(
            entry_urls.as_slice(),
            "https://github.com"
        ));
    }
}
