package studio

// Host-owned synthetic store facet. Site IDs come from verified release context.
func storeRows(site string) []M {
	if site == "site_pc_synthetic" {
		return []M{{"id": "ST-1001", "name": "架空・東店", "prefecture": "13"}, {"id": "ST-1002", "name": "架空・西店", "prefecture": "27"}}
	}
	if site == "site_other_synthetic" {
		return []M{{"id": "ST-9001", "name": "架空・別サイト店", "prefecture": "13"}}
	}
	return []M{}
}
