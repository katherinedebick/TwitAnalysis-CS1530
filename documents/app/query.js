module.exports = class Query{
  constructor(search_word, sample_size, start_date, end_date){
    this.search_word = search_word;
    this.sample_size = sample_size;
    this.start_date = start_date;
    this.end_date = end_date;
  }
};
